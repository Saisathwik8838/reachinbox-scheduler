import { db } from './db/client.js';
import Redis from 'ioredis';
import { redisConfig } from './queue/queue.js';

const redis = new Redis(redisConfig);

async function main() {
  console.log("Running rate limit test (limit: 2/sender, 15 emails)...");

  // Clear previous Redis rate limiter keys
  const senderKeys = await redis.keys("rate:*");
  if (senderKeys.length > 0) {
    await redis.del(...senderKeys);
    console.log(`Cleared ${senderKeys.length} rate keys in Redis.`);
  }

  // Dev token
  const loginRes = await fetch("http://localhost:4000/api/auth/dev-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "saisathwik@gmail.com", name: "Sai Sathwik" }),
  });
  const { token } = (await loginRes.json()) as { token: string };

  // 15 recipients distributed across senders
  const recipients = Array.from({ length: 15 }, (_, i) => `rate.overflow.${i + 1}@example.com`);

  console.log("Scheduling 15 emails with hourlyLimit = 2...");
  const authedRes = await fetch("http://localhost:4000/api/emails/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subject: "Rate Limit Test",
      body: "Testing hourly limit reschedule",
      recipients,
      startTime: new Date().toISOString(),
      delayBetweenSeconds: 0,
      hourlyLimit: 2,
    }),
  });

  const schedData = (await authedRes.json()) as { batchId: string; accepted: number };
  console.log("Batch scheduled:", schedData.batchId);

  console.log("Waiting 12 seconds for queue processing...");
  await new Promise((r) => setTimeout(r, 12000));

  const emails = await db.email.findMany({
    where: { batchId: schedData.batchId },
    include: { sender: true },
    orderBy: { recipient: "asc" },
  });

  let sentCount = 0;
  let rescheduledCount = 0;

  for (const email of emails) {
    console.log(
      `Recipient: ${email.recipient} | Sender: ${email.sender.email} | Status: ${email.status} | Rescheduled: ${email.rescheduleCount}`
    );
    if (email.status === "sent") sentCount++;
    if (email.status === "scheduled" && email.rescheduleCount > 0) rescheduledCount++;
  }

  console.log(`Summary: Sent=${sentCount}, Rescheduled=${rescheduledCount}`);
  if (rescheduledCount > 0) {
    console.log("Rate limit verified: overflow emails successfully rescheduled.");
  }

  await redis.quit();
  await db.$disconnect();
}

main().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
