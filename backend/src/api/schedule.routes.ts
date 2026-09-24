import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { db } from "../db/client.js";
import { emailQueue } from "../queue/queue.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { getAllSenders, initializeSenders } from "../senders/ethereal.js";
import { logger } from "../utils/logger.js";

const router = Router();

const scheduleSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  recipients: z.array(z.string()).min(1, "At least one recipient is required"),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO date string for startTime",
  }),
  delayBetweenSeconds: z.coerce.number().min(0).default(0),
  hourlyLimit: z.coerce.number().min(1).optional(),
});

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

router.post(
  "/schedule",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = scheduleSchema.parse(req.body);
      const { subject, body, recipients, startTime, delayBetweenSeconds, hourlyLimit } = validated;

      const total = recipients.length;
      const seen = new Set<string>();
      const validRecipients: string[] = [];
      let invalidCount = 0;

      for (const raw of recipients) {
        const cleaned = raw.trim().toLowerCase();
        if (emailRegex.test(cleaned)) {
          if (!seen.has(cleaned)) {
            seen.add(cleaned);
            validRecipients.push(cleaned);
          } else {
            invalidCount++;
          }
        } else {
          invalidCount++;
        }
      }

      if (validRecipients.length === 0) {
        return res.status(400).json({
          error: "No valid unique recipients found in the submitted list.",
        });
      }

      let senders = await getAllSenders();
      if (senders.length === 0) {
        await initializeSenders();
        senders = await getAllSenders();
      }

      const batchId = crypto.randomUUID();
      const startTimeMs = Math.max(Date.parse(startTime), Date.now());

      const emailRecords = validRecipients.map((recipient, i) => {
        const id = crypto.randomUUID();
        const sender = senders[i % senders.length];
        const scheduledTimeMs = startTimeMs + i * delayBetweenSeconds * 1000;
        const scheduledAt = new Date(scheduledTimeMs);

        return {
          id,
          userId: req.user!.id,
          batchId,
          recipient,
          subject,
          body,
          senderId: sender.id,
          scheduledAt,
          hourlyLimit: hourlyLimit || null,
          status: "scheduled" as const,
        };
      });

      const firstSendAt = emailRecords[0].scheduledAt.toISOString();
      const lastSendAt = emailRecords[emailRecords.length - 1].scheduledAt.toISOString();

      // Chunk writes so large lists don't exceed database parameter limits
      const INSERT_CHUNK_SIZE = 1000;
      for (let i = 0; i < emailRecords.length; i += INSERT_CHUNK_SIZE) {
        const chunk = emailRecords.slice(i, i + INSERT_CHUNK_SIZE);
        await db.email.createMany({
          data: chunk,
        });
      }

      logger.info(
        `Batch ${batchId}: Created ${emailRecords.length} email records for user ${req.user!.email}`
      );

      // Return immediately with 202 so large batches do not block HTTP response
      res.status(202).json({
        batchId,
        total,
        accepted: emailRecords.length,
        invalid: invalidCount,
        firstSendAt,
        lastSendAt,
      });

      // Enqueue to Redis in chunks
      (async () => {
        try {
          const QUEUE_CHUNK_SIZE = 500;
          for (let i = 0; i < emailRecords.length; i += QUEUE_CHUNK_SIZE) {
            const chunk = emailRecords.slice(i, i + QUEUE_CHUNK_SIZE);
            const jobs = chunk.map((email) => {
              const delay = Math.max(0, email.scheduledAt.getTime() - Date.now());
              return {
                name: "send-email",
                data: { emailId: email.id },
                opts: {
                  jobId: email.id,
                  delay,
                },
              };
            });

            await emailQueue.addBulk(jobs);
          }
          logger.info(`Batch ${batchId}: Finished enqueuing ${emailRecords.length} jobs to queue.`);
        } catch (queueErr) {
          logger.error(`Batch ${batchId}: Error enqueuing jobs:`, queueErr);
        }
      })();
    } catch (err) {
      next(err);
    }
  }
);

router.get("/scheduled", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "10", 10)));
    const skip = (page - 1) * limit;

    const [emails, total, nextSend] = await Promise.all([
      db.email.findMany({
        where: {
          userId: req.user!.id,
          status: "scheduled",
        },
        orderBy: {
          scheduledAt: "asc",
        },
        skip,
        take: limit,
      }),
      db.email.count({
        where: {
          userId: req.user!.id,
          status: "scheduled",
        },
      }),
      db.email.findFirst({
        where: {
          userId: req.user!.id,
          status: "scheduled",
        },
        orderBy: {
          scheduledAt: "asc",
        },
        select: {
          scheduledAt: true,
        },
      }),
    ]);

    const sentCount = await db.email.count({
      where: {
        userId: req.user!.id,
        status: { in: ["sent", "failed"] },
      },
    });

    res.json({
      emails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        scheduledCount: total,
        sentCount,
        nextSendAt: nextSend?.scheduledAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/sent", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "10", 10)));
    const skip = (page - 1) * limit;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [emails, total, failedLast24h, scheduledCount] = await Promise.all([
      db.email.findMany({
        where: {
          userId: req.user!.id,
          status: { in: ["sent", "failed"] },
        },
        orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      db.email.count({
        where: {
          userId: req.user!.id,
          status: { in: ["sent", "failed"] },
        },
      }),
      db.email.count({
        where: {
          userId: req.user!.id,
          status: "failed",
          createdAt: { gte: oneDayAgo },
        },
      }),
      db.email.count({
        where: {
          userId: req.user!.id,
          status: "scheduled",
        },
      }),
    ]);

    res.json({
      emails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        scheduledCount,
        sentCount: total,
        failedLast24h,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
