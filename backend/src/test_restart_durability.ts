import { db } from './db/client.js';

async function main() {
  console.log("Setting up restart durability test...");

  // Dev token
  const loginRes = await fetch("http://localhost:4000/api/auth/dev-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "saisathwik@gmail.com", name: "Sai Sathwik" }),
  });
  const { token } = (await loginRes.json()) as { token: string };

  // Schedule 3 emails 15 seconds into the future
  const sendTime = new Date(Date.now() + 15000);
  const recipients = [
    "restart.survivor1@example.com",
    "restart.survivor2@example.com",
    "restart.survivor3@example.com",
  ];

  console.log(`Scheduling 3 emails for future send at ${sendTime.toISOString()}...`);
  const authedRes = await fetch("http://localhost:4000/api/emails/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subject: "Restart Durability Test",
      body: "Testing dispatch surviving restart",
      recipients,
      startTime: sendTime.toISOString(),
      delayBetweenSeconds: 2,
    }),
  });

  const schedData = (await authedRes.json()) as { batchId: string };
  console.log("Batch created:", schedData.batchId);

  // Verify status in DB before restart
  const preCheck = await db.email.findMany({ where: { batchId: schedData.batchId } });
  console.log(`Verified in DB: ${preCheck.length} emails created with status '${preCheck[0].status}'.`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Error in restart test setup:', err);
  process.exit(1);
});
