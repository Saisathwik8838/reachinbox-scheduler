import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const QUEUE_NAME = "email-queue";

export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
};

// Queue connection for producing jobs
export const redisProducer = new Redis(redisConfig);

redisProducer.on("error", (err) => {
  logger.error("Redis producer error:", err);
});

export const emailQueue = new Queue(QUEUE_NAME, {
  connection: redisProducer,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400,
    },
    removeOnFail: false,
  },
});
