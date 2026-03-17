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
2. Create `.env` with:
   `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"`
3. `npm run prisma:generate`
4. `npm run prisma:migrate:dev`
5. `npm run db:seed`
6. `npm run dev`

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
