import { Worker, Job, DelayedError } from "bullmq";
import Redis from "ioredis";
import { QUEUE_NAME, redisConfig } from "./queue.js";
import { db } from "../db/client.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { checkAndIncrementHourlyLimit } from "../rateLimiter/hourlyLimiter.js";
import { sendMail } from "../senders/mailer.js";

let workerInstance: Worker | null = null;
let redisWorkerConnection: Redis | null = null;
let rateLimitRedis: Redis | null = null;

export interface EmailJobData {
  emailId: string;
}

// Start the BullMQ worker for sending emails
export function startWorker(): Worker {
  if (workerInstance) {
    logger.warn("Worker already started");
    return workerInstance;
  }

  // Dedicated Redis connections for BullMQ Worker and rate limiter
  redisWorkerConnection = new Redis(redisConfig);
  rateLimitRedis = new Redis(redisConfig);

  workerInstance = new Worker<EmailJobData>(
    QUEUE_NAME,
    async (job: Job<EmailJobData>, token?: string) => {
      const { emailId } = job.data;
      logger.info(`Processing email ${emailId} (attempt ${job.attemptsMade + 1})`);

      const email = await db.email.findUnique({
        where: { id: emailId },
        include: { sender: true },
      });

      // Skip if already deleted or already sent
      if (!email) {
        logger.warn(`Email ${emailId} not found in database. Skipping.`);
        return;
      }

      if (email.status === "sent") {
        logger.info(`Email ${emailId} already sent. Skipping.`);
        return;
      }

      // Check hourly limit for this sender
      const effectiveLimit = email.hourlyLimit ?? env.MAX_EMAILS_PER_HOUR;
      const rateCheck = await checkAndIncrementHourlyLimit(
        rateLimitRedis!,
        email.sender.email,
        effectiveLimit
      );

      if (!rateCheck.allowed) {
        // Delay email into the next hour window plus a small random jitter
        const jitterMs = Math.floor(Math.random() * 29000) + 1000;
        const delayMs = rateCheck.msUntilNextHour + jitterMs;
        const nextScheduledAt = new Date(Date.now() + delayMs);

        logger.warn(
          `Sender ${email.sender.email} reached hourly limit (${rateCheck.count}/${effectiveLimit}). ` +
          `Rescheduling ${emailId} to ${nextScheduledAt.toISOString()}.`
        );

        await db.email.update({
          where: { id: emailId },
          data: {
            scheduledAt: nextScheduledAt,
            rescheduleCount: { increment: 1 },
          },
        });

        // BullMQ v5: move job to delayed and throw DelayedError so it does not fail
        await job.moveToDelayed(Date.now() + delayMs, token);
        throw new DelayedError();
      }

      // Send the email via SMTP
      try {
        const result = await sendMail({
          senderUser: email.sender.user,
          senderPass: email.sender.pass,
          senderEmail: email.sender.email,
          recipient: email.recipient,
          subject: email.subject,
          body: email.body,
        });

        await db.email.update({
          where: { id: emailId },
          data: {
            status: "sent",
            sentAt: new Date(),
            messageId: result.messageId,
            previewUrl: result.previewUrl,
            attempts: job.attemptsMade + 1,
            error: null,
          },
        });

        logger.info(`Sent email ${emailId} to ${email.recipient}`);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`[Job ${job.id}] Send failed for email ${emailId}: ${errorMessage}`);

        // Update attempts count in DB
        await db.email.update({
          where: { id: emailId },
          data: {
            attempts: job.attemptsMade + 1,
            error: errorMessage,
          },
        });

        // Re-throw so BullMQ handles backoff retries
        throw err;
      }
    },
    {
      connection: redisWorkerConnection,
      concurrency: env.WORKER_CONCURRENCY,
      limiter: {
        max: 1,
        duration: env.MIN_DELAY_BETWEEN_SENDS_MS,
      },
    }
  );

  // BullMQ Worker event listeners
  workerInstance.on("completed", (job) => {
    logger.debug(`Worker: Job ${job.id} completed successfully.`);
  });

  workerInstance.on("failed", async (job, err) => {
    // If the failure was a deliberate DelayedError from rate-limiting, ignore
    if (err instanceof DelayedError || err.name === "DelayedError") {
      return;
    }

    if (!job) {
      logger.error("Worker: Job failed without job context:", err);
      return;
    }

    logger.error(`Worker: Job ${job.id} failed attempt ${job.attemptsMade}: ${err.message}`);

    const maxAttempts = job.opts.attempts || 3;
    if (job.attemptsMade >= maxAttempts) {
      logger.error(`Worker: Job ${job.id} reached maximum attempts (${maxAttempts}). Marking email as failed in DB.`);
      try {
        await db.email.update({
          where: { id: job.data.emailId },
          data: {
            status: "failed",
            error: err.message,
            attempts: job.attemptsMade,
          },
        });
      } catch (dbErr) {
        logger.error(`Failed to update DB for permanently failed job ${job.id}:`, dbErr);
      }
    }
  });

  workerInstance.on("error", (err) => {
    logger.error("Worker error:", err);
  });

  logger.info(
    `Email Worker started (concurrency: ${env.WORKER_CONCURRENCY}, min delay: ${env.MIN_DELAY_BETWEEN_SENDS_MS}ms)`
  );

  return workerInstance;
}

// Stop the worker and close Redis connections
export async function stopWorker(): Promise<void> {
  if (workerInstance) {
    logger.info("Closing BullMQ worker...");
    await workerInstance.close();
    workerInstance = null;
  }
  if (redisWorkerConnection) {
    await redisWorkerConnection.quit();
    redisWorkerConnection = null;
  }
  if (rateLimitRedis) {
    await rateLimitRedis.quit();
    rateLimitRedis = null;
  }
  logger.info("BullMQ worker stopped.");
}

// Auto-start if invoked directly via `npm run worker`
const isMainScript = process.argv[1]?.replace(/\\/g, "/").includes("src/queue/worker");
if (isMainScript) {
  logger.info("Starting standalone BullMQ worker process...");
  startWorker();

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down standalone worker...`);
    await stopWorker();
    await db.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}
