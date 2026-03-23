# PulseFund

PulseFund is a demo-ready donations platform scaffold built as a TypeScript monolith with Next.js and Prisma.

This repository includes the current MVP flow:

- campaign listing and campaign detail views
- donation flow with simulated payment completion
- donor blob visualization with accessible fallback table
- Prisma schema + demo seed data
- focused unit/integration test coverage for critical domain logic

## Planned Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Zod
- Vitest + Testing Library + Playwright

## Local Setup

1. `npm install`
2. Create a root `.env` file. The app reads `.env` directly via Next.js and Prisma.
3. Add the local database connection:
   `DATABASE_URL="postgresql://pulsefund:pulsefund@127.0.0.1:54329/pulsefund?schema=public"`
4. Start the local PostgreSQL database:
   `docker compose up -d db`
5. Optional Resend setup for the thank-you email demo:
   `RESEND_API_KEY="re_xxxxx"`
   `RESEND_FROM_EMAIL="PulseFund <onboarding@resend.dev>"`
   `PULSEFUND_BASE_URL="http://localhost:3000"`
6. For Resend test mode without a custom domain, keep `RESEND_FROM_EMAIL` as `onboarding@resend.dev` and use the email address tied to your own Resend account as the donor email in the form.
7. `npm run prisma:generate`
8. `npm run prisma:migrate:dev`
9. `npm run db:seed`
10. `npm run dev`

## Local Pipeline

This is the practical local pipeline for the project from configuration to a running app:

```text
.env -> docker compose up -d db -> prisma generate -> prisma migrate -> db seed -> next dev
```

You can also think of it as this flow:

1. Environment variables define the database and app configuration.
2. PostgreSQL starts locally in Docker on `127.0.0.1:54329`.
3. Prisma generates the client from [`prisma/schema.prisma`]
4. Prisma migrations create and update the database tables.
5. Seed data populates the demo content.
6. Next.js starts the web app for local development.

Common local command sequence:

```powershell
docker compose up -d db
npm.cmd run prisma:generate
npx.cmd prisma migrate deploy
npm.cmd run db:seed
npm.cmd run dev
```

## Test Commands

- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`

## Demo Walkthrough

1. Open `/campaigns` to view published campaigns and progress.
2. Open a campaign detail page to review description, donor blobs, fallback donation table, and donation feed.
3. Open `/donate/[campaignId]` and submit a simulated donation.
4. Return to the campaign detail page and confirm updated donation visibility and anonymity-safe public display.

## MVP Constraints

- no real payment gateway integration (simulated completion only)
- no advanced authentication/authorization subsystem
- no advanced analytics or dashboard systems
- `AuditEvent` remains lightweight with sanitized metadata only
