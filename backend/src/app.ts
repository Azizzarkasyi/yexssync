// Enforce server timezone to Asia/Jakarta to prevent UTC-offset date bugs
process.env.TZ = "Asia/Jakarta";

import express, {Express, Request, Response, NextFunction} from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import {tenantMiddleware, optionalTenantMiddleware} from "./middleware/tenant";
import {autoMigrateTenants} from "./config/auto-migrate";

// Routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import attendanceRoutes from "./routes/attendance.routes";
import taskRoutes from "./routes/task.routes";
import payrollRoutes from "./routes/payroll.routes";
import breakRoutes from "./routes/break.routes";
import faceRoutes from "./routes/face.routes";
import configRoutes from "./routes/config.routes";
import superAdminRoutes from "./routes/super-admin.routes";

const app: Express = express();

// Trust reverse proxy (Cloudflare, Nginx, Docker) for accurate client IP in rate limiting
app.set("trust proxy", 1);

// Hide server fingerprint
app.disable("x-powered-by");

// Security Headers (Anti-XSS, MIME sniffing, Clickjacking)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow serving uploaded photos & avatars across origins
    contentSecurityPolicy: false, // Keep false to allow Swagger UI and API endpoints
  })
);

import {ENV} from "./config/env";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, {recursive: true});
}

// ============================================
// Security: CORS Whitelist (from .env)
// ============================================
const allowedOrigins = ENV.CORS_ALLOWED_ORIGINS;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow localhost and local network in development
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://192.168.") ||
        origin.endsWith(".yexsx.my.id")
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
  }),
);

// Body parser middleware with configurable limit
const uploadLimit = `${ENV.UPLOAD_MAX_SIZE_MB}mb`;
app.use(express.json({limit: uploadLimit}));
app.use(express.urlencoded({extended: true, limit: uploadLimit}));
app.use("/api/uploads", express.static(uploadsDir));
app.use("/uploads", express.static(uploadsDir));

// ============================================
// Security: Rate Limiting (Anti-DDoS Layer 7 & Brute-force protection)
// ============================================
const isRateLimitEnabled = process.env.DISABLE_RATE_LIMIT !== "true";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // max 60 attempts per 15 minutes per IP
  message: {
    success: false,
    message: "Terlalu banyak percobaan login/autentikasi. Coba lagi dalam 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isRateLimitEnabled || (req.ip === "127.0.0.1" && process.env.NODE_ENV === "test"),
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  message: {
    success: false,
    message: "Terlalu banyak request. Coba lagi dalam beberapa saat.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isRateLimitEnabled || (req.ip === "127.0.0.1" && process.env.NODE_ENV === "test"),
});

// Protect all authentication endpoints against credential stuffing & brute-force
app.use("/api/auth", authLimiter);
app.use("/auth", authLimiter);
app.use("/api/super-admin/login", authLimiter);
app.use("/super-admin/login", authLimiter);

// General API Rate Limiting (Anti-Flooding)
app.use("/api", apiLimiter);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Multi-Tenant Attendance API is running",
    version: "1.0.0",
  });
});

// Auth routes
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes); // Fallback for stripped Nginx

// Super Admin routes
app.use("/api/super-admin", superAdminRoutes);
app.use("/super-admin", superAdminRoutes); // Fallback

// Tenant list endpoint
const tenantListHandler = async (req: Request, res: Response) => {
  try {
    const {getPublicPrisma} = require("./prisma/tenant-prisma");
    const prisma = getPublicPrisma();

    const tenants = await prisma.tenant.findMany({
      where: {isActive: true},
      select: {id: true, name: true},
      orderBy: {name: "asc"},
    });

    res.json({success: true, data: tenants});
  } catch (error) {
    console.error("Get tenants error:", error);
    res.status(500).json({success: false, message: "Internal server error"});
  }
};
app.get("/api/tenants", tenantListHandler);
app.get("/tenants", tenantListHandler);

// All tenant-specific routes need tenant middleware
const apiRoutes = [
  {path: "/users", router: userRoutes},
  {path: "/attendance", router: attendanceRoutes},
  {path: "/tasks", router: taskRoutes},
  {path: "/payroll", router: payrollRoutes},
  {path: "/payrolls", router: payrollRoutes},
  {path: "/break", router: breakRoutes},
  {path: "/breaks", router: breakRoutes},
  {path: "/face", router: faceRoutes},
  {path: "/config", router: configRoutes},
];

apiRoutes.forEach(route => {
  app.use(`/api${route.path}`, tenantMiddleware, route.router);
  app.use(route.path, tenantMiddleware, route.router); // Fallback
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Auto-migrate schema for existing tenants on boot (delayed)
setTimeout(() => {
  autoMigrateTenants();
}, 5000);

export default app;
