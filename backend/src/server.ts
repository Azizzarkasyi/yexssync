process.env.TZ = "Asia/Jakarta";
import app from "./app";
import dotenv from "dotenv";
import { startCleanupCron } from "./utils/cleanup";

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
  
  // Start automated cleanup job
  startCleanupCron();
});

// Security: Slowloris & Connection Exhaustion Protection (Anti-DDoS Layer 7)
server.requestTimeout = 30000; // 30 seconds
server.headersTimeout = 35000; // 35 seconds (must exceed keepAliveTimeout)
server.keepAliveTimeout = 30000; // 30 seconds

// Prevent process from exiting by keeping event loop active
setInterval(() => { }, 1000 * 60 * 60); // Keep alive indefinitely

process.on('SIGINT', () => {
  console.log('Received SIGINT. Press Control-D to exit.');
  process.exit(0);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
});
