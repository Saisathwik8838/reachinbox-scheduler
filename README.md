# ReachInbox Email Job Scheduler

A full-stack email scheduling application built with Node.js, Express, BullMQ, Redis, PostgreSQL (Prisma), and React.

## What it does

- Schedules emails for immediate or delayed delivery using Redis-backed BullMQ delayed jobs (no cron).
- Prevents duplicate sends by checking PostgreSQL before every dispatch and using the email ID as the queue job ID.
- Automatically recovers on server restart: on boot, the backend checks PostgreSQL for any scheduled emails and re-enqueues missing jobs into BullMQ.
- Enforces hourly sending limits per sender using Redis sliding windows. If a sender hits their limit, remaining emails are rescheduled to the next hour instead of being dropped.
- Uses Ethereal SMTP test accounts to simulate realistic email dispatch with live message preview URLs.
- Provides a dashboard showing scheduled and sent emails with server-side pagination, status badges, and automatic polling every 10 seconds.

## Project Structure

```
reachinbox-scheduler/
├── backend/
│   ├── src/
│   │   ├── api/             # Schedule and email query endpoints
│   │   ├── auth/            # Google OAuth and session management
│   │   ├── config/          # Environment configuration
│   │   ├── db/              # Prisma client and schema
│   │   ├── queue/           # BullMQ queue and worker definition
│   │   ├── rateLimiter/     # Redis hourly rate limiter
│   │   ├── senders/         # Ethereal SMTP account manager and mailer
│   │   └── index.ts         # Express server and startup reconciliation
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components, table, modal, header
│   │   ├── context/         # Auth and Toast context providers
│   │   ├── hooks/           # useEmails polling hook
│   │   ├── lib/             # API client and CSV parser
│   │   ├── pages/           # Login and Dashboard pages
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml       # PostgreSQL and Redis services
├── sample_leads.csv         # Sample recipient list for testing
└── README.md
```

## Setup and Running

### 1. Prerequisites

- Node.js (v20 or higher)
- Docker and Docker Compose

### 2. Start PostgreSQL and Redis

Start the database and Redis containers from the project root:

```bash
docker compose up -d
```

This starts:
- PostgreSQL on port `5432` (`reachinbox_db`)
- Redis on port `6379` (with AOF persistence enabled)

### 3. Backend Setup

```bash
cd backend
npm install
npx prisma db push
npm run dev
```

The backend server runs on `http://localhost:4000`.

Environment variables are configured in `backend/.env`. A `.env.example` is provided with default local values.

### 4. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### 5. Signing In

1. Open `http://localhost:5173/login`.
2. Click **Continue with Google** to sign in with your Google account.
3. For local development or testing without OAuth consent screens, click **Quick Dev Sign-in (Sai Sathwik)**.

## How It Works

### Scheduling
When scheduling a batch of emails, the backend:
1. Validates the recipient list, subject, body, and start time.
2. Creates rows in PostgreSQL with status `scheduled`.
3. Adds delayed jobs to BullMQ in Redis where `jobId = email.id` and `delay = Math.max(0, scheduledAt - now)`.
4. Returns HTTP 202 immediately so requests do not time out on large batches.

### Worker & Rate Limiting
1. The BullMQ worker picks up a job when its scheduled time arrives.
2. It verifies the email in PostgreSQL is still `scheduled` and has not already been sent (idempotency guard).
3. It checks Redis to see if the sender has exceeded their hourly limit. If the limit is reached, it updates `scheduledAt` in the database and calls `job.moveToDelayed()` to roll the email into the next hour.
4. If allowed, it sends the email via Ethereal SMTP and records `status = 'sent'`, `sentAt`, `messageId`, and the Ethereal `previewUrl`.

### Durability on Restart
If the backend crashes or restarts:
1. When booting up, `reconcileScheduledEmails()` finds all emails marked `scheduled` in PostgreSQL.
2. It inspects BullMQ to verify each job exists in Redis. Any missing jobs are re-added with the remaining delay.
3. Because BullMQ uses the database row ID as the job ID, duplicates cannot be created.

## Testing & Verification

A test script is included in `backend/src/test_rate_limit.ts` to verify hourly rate limiting and queue rescheduling:

```bash
cd backend
npx tsx src/test_rate_limit.ts
```
