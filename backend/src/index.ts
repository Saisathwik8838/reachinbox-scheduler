import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { db } from "./db/client.js";
import { emailQueue, redisProducer } from "./queue/queue.js";
import { startWorker, stopWorker } from "./queue/worker.js";
import { initializeSenders } from "./senders/ethereal.js";
import authRoutes from "./auth/google.routes.js";
import scheduleRoutes from "./api/schedule.routes.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Request logging in development
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    const redisPing = await redisProducer.ping();
    res.json({
      status: "ok",
      database: "connected",
      redis: redisPing === "PONG" ? "connected" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(503).json({
      status: "error",
      error: msg,
    });
  }
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/emails", scheduleRoutes);

// Central Error Handling
app.use(errorHandler);

// Reconcile database and Redis on startup so any jobs scheduled before a crash or restart are queued
async function reconcileScheduledEmails() {
  logger.info("Checking for scheduled emails to reconcile...");
  try {
    const scheduledEmails = await db.email.findMany({
      where: { status: "scheduled" },
      select: { id: true, scheduledAt: true },
    });

    let reconciledCount = 0;
    for (const email of scheduledEmails) {
      const existingJob = await emailQueue.getJob(email.id);
      if (!existingJob) {
        const delay = Math.max(0, email.scheduledAt.getTime() - Date.now());
        await emailQueue.add(
          "send-email",
          { emailId: email.id },
          { delay, jobId: email.id }
        );
        reconciledCount++;
      }
    }

    if (reconciledCount > 0) {
      logger.info(`Reconciled ${reconciledCount} missing jobs into BullMQ`);
    } else {
      logger.info("All scheduled jobs are already in BullMQ");
    }
  } catch (err) {
    logger.error("Failed to reconcile queue:", err);
  }
}

// Start Server
const server = app.listen(env.PORT, "0.0.0.0", async () => {
  logger.info(`Server running on port ${env.PORT} (0.0.0.0)`);

  try {
    // Make sure test senders exist in the database
    await initializeSenders(env.SENDER_COUNT);

    // Queue any pending emails that aren't in Redis yet
    await reconcileScheduledEmails();

    if (env.RUN_WORKER) {
      logger.info("Starting email queue worker...");
      startWorker();
    }
  } catch (err) {
    logger.error("Startup error:", err);
  }
});

// Graceful Shutdown
let isShuttingDown = false;
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  try {
    server.close(() => {
      logger.info("HTTP server closed.");
    });

    if (env.RUN_WORKER) {
      await stopWorker();
    }

    await emailQueue.close();
    await redisProducer.quit();
    await db.$disconnect();
    logger.info("Clean shutdown complete. Exiting.");
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default app;
