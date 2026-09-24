import nodemailer from "nodemailer";
import { db } from "../db/client.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

interface EtherealAccountResponse {
  user: string;
  pass: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
  imap: {
    host: string;
    port: number;
    secure: boolean;
  };
  pop3: {
    host: string;
    port: number;
    secure: boolean;
  };
  web: string;
}

// Create a test account directly via Ethereal API so we get unique credentials each time
async function createFreshEtherealAccount(): Promise<{ user: string; pass: string }> {
  try {
    const res = await fetch("https://api.nodemailer.com/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestor: "reachinbox-scheduler", version: "1.0.0" }),
    });

    if (res.ok) {
      const data = (await res.json()) as EtherealAccountResponse;
      if (data && data.user && data.pass) {
        return { user: data.user, pass: data.pass };
      }
    }
  } catch (err) {
    logger.warn("Direct Ethereal API call failed, trying nodemailer fallback...", err);
  }

  const fallback = await nodemailer.createTestAccount();
  return { user: fallback.user, pass: fallback.pass };
}

// Make sure we have the required number of sender accounts saved in the database
export async function initializeSenders(requiredCount: number = env.SENDER_COUNT): Promise<void> {
  let existingCount = await db.sender.count();

  if (existingCount >= requiredCount) {
    return;
  }

  logger.info(`Creating test sender accounts (${existingCount}/${requiredCount})...`);

  while (existingCount < requiredCount) {
    try {
      const account = await createFreshEtherealAccount();
      const email = account.user.includes("@") ? account.user : `${account.user}@ethereal.email`;

      await db.sender.upsert({
        where: { email },
        update: {
          user: account.user,
          pass: account.pass,
        },
        create: {
          email,
          user: account.user,
          pass: account.pass,
        },
      });

      existingCount = await db.sender.count();

      if (existingCount < requiredCount) {
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (err) {
      logger.error("Failed to create sender account:", err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  logger.info(`Sender pool ready with ${existingCount} accounts.`);
}

export async function getAllSenders() {
  return db.sender.findMany({
    orderBy: { createdAt: "asc" },
  });
}
