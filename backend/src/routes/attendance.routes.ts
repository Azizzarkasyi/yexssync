import {Router} from "express";
import multer from "multer";
import path from "path";
import {
  clockIn,
  clockOut,
  getHistory,
  getTodayAttendance,
  getStatistics,
  getAllTodayAttendance,
  getAttendanceReport,
  requestLeave,
  getLeaveRequests,
  reviewLeaveRequest,
  requestAttendanceCorrection,
  getAttendanceCorrections,
  reviewAttendanceCorrection,
  getLateDeductions,
  reviewLateDeduction,
  getTodayAttendanceStats,
} from "../controllers/attendance.controller";
import {authenticate, authorizeAdmin} from "../middleware/auth.middleware";

const router = Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "attendance-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 20 * 1024 * 1024}, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG, JPG, and PNG files are allowed"));
  },
});

// All routes require authentication
router.post("/clock-in", authenticate, upload.single("photo"), clockIn);
router.post("/clock-out", authenticate, upload.single("photo"), clockOut);
router.post("/leave", authenticate, upload.single("photo"), requestLeave);
router.post("/:id/correction", authenticate, requestAttendanceCorrection);
router.get("/today", authenticate, getTodayAttendance);
router.get("/history", authenticate, getHistory);
router.get("/statistics", authenticate, getStatistics);

// Admin routes
router.get("/admin/today", authenticate, authorizeAdmin, getAllTodayAttendance);
router.get("/admin/leaves", authenticate, authorizeAdmin, getLeaveRequests);
router.get("/leaves", authenticate, authorizeAdmin, getLeaveRequests);
router.get("/leave", authenticate, authorizeAdmin, getLeaveRequests);
router.patch(
  "/admin/leaves/:id",
  authenticate,
  authorizeAdmin,
  reviewLeaveRequest,
);
router.put(
  "/admin/leaves/:id",
  authenticate,
  authorizeAdmin,
  reviewLeaveRequest,
);
router.put("/leaves/:id", authenticate, authorizeAdmin, reviewLeaveRequest);
router.patch("/leaves/:id", authenticate, authorizeAdmin, reviewLeaveRequest);
router.put("/leave/:id", authenticate, authorizeAdmin, reviewLeaveRequest);
router.patch("/leave/:id", authenticate, authorizeAdmin, reviewLeaveRequest);
router.get(
  "/admin/corrections",
  authenticate,
  authorizeAdmin,
  getAttendanceCorrections,
);
router.patch(
  "/admin/corrections/:id",
  authenticate,
  authorizeAdmin,
  reviewAttendanceCorrection,
);
router.get(
  "/admin/late-deductions",
  authenticate,
  authorizeAdmin,
  getLateDeductions,
);
router.patch(
  "/admin/late-deductions/:id",
  authenticate,
  authorizeAdmin,
  reviewLateDeduction,
);
router.get("/stats/today", authenticate, getTodayAttendanceStats);
router.get("/admin/stats/today", authenticate, authorizeAdmin, getTodayAttendanceStats);

export default router;
