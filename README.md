# PulseFund

PulseFund is a demo-ready donations platform built as a TypeScript monolith with Next.js and Prisma.

The current app includes:

- published campaign listing and campaign detail views
- donation flow with simulated checkout and receipt generation
- donor blob visualization with an accessible fallback table
- admin campaign management, milestone editing, and campaign requests
- homepage celebration mode when an eligible published campaign reaches its goal
- Terms of Service page
- Prisma schema, migrations, and demo seed data
- focused unit and integration test coverage for core domain logic

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Zod
- Vitest + Testing Library + Playwright

## Local Setup

1. `npm install`
2. Create a root `.env` file. The app reads `.env` directly through Next.js and Prisma.
3. Add the local database connection:
   `DATABASE_URL="postgresql://pulsefund:pulsefund@127.0.0.1:54329/pulsefund?schema=public"`
4. Optional Resend setup for the thank-you email demo:
   `RESEND_API_KEY="re_xxxxx"`
   `RESEND_FROM_EMAIL="PulseFund <onboarding@resend.dev>"`
   `PULSEFUND_BASE_URL="http://localhost:3000"`
5. For Resend test mode without a custom domain, keep `RESEND_FROM_EMAIL` as `onboarding@resend.dev` and use the email address tied to your own Resend account as the donor email in the form.
6. Generate Prisma Client:
   `npm run prisma:generate`
7. Apply the checked-in migrations to the local database:
   `npx prisma migrate deploy`
8. Seed the demo data:
   `npm run db:seed`
9. Start the app:
   `npm run dev`

## Docker Setup

1. Build and start the app with Postgres:
   `docker compose up --build`
2. Open `http://localhost`

Notes:

- Nginx listens on port `80` and proxies requests to the app container.
- The app container runs `prisma migrate deploy` and `node prisma/seed.js` on startup.
- Because seeding runs on every app start, demo data is reset each time the app container restarts.

## Prisma Workflow

- Regenerate client after schema changes:
  `npm run prisma:generate`
- Apply checked-in migrations locally:
  `npx prisma migrate deploy`
- Create a new local migration while developing schema changes:
  `npm run prisma:migrate:dev`
- Reset demo content back to the curated local state:
  `npm run db:seed`

The current seed includes:

- 4 campaigns
- 11 donations
- 1 completed campaign that activates celebration mode on the homepage

## Test Commands

- `npm run typecheck`
- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`

## Demo Walkthrough

1. Open `/` to view the homepage, donation blob map, and celebration mode when the seeded completed campaign is active.
2. Open `/campaigns` to view published campaigns and progress.
3. Open a campaign detail page to review milestones, description, donor blobs, and donation feed.
4. Open `/donate/[campaignId]` and submit a simulated donation through the staged payment form.
5. Open `/my-donations` to look up history with a Supporter Access Code.
6. Open `/admin/campaigns` and `/admin/campaigns/[id]/edit` to review campaign analytics, toggle celebration mode, and edit campaign settings.
7. Open `/terms-of-service` to review the static platform policy page.

## Current Constraints

- no real payment gateway integration; checkout is simulated
- no full authentication or authorization subsystem
- no external real-time event streaming; homepage success state is computed server-side
- blob rendering keeps existing physics and interaction behavior even during celebration mode
- `AuditEvent` remains lightweight with sanitized metadata only
