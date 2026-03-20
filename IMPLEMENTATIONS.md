# PulseFund Implementations

This document summarizes the major implementations currently present in PulseFund. It is intended as a project handoff and reference file for understanding what has already been built.

## Project Shape

PulseFund is a Next.js App Router application backed by Prisma and PostgreSQL. The codebase follows a layered structure:

- `app/`
  Route handlers, pages, and server actions
- `components/`
  Reusable UI building blocks
- `lib/domain/`
  Pure domain logic and presentation mapping helpers
- `lib/services/`
  Business logic and transactional application flows
- `lib/persistence/`
  Query functions and Prisma-facing read models
- `prisma/`
  Schema, migrations, and seed data
- `tests/`
  Unit and integration coverage

## Core Platform Features

### 1. Campaign Browsing

Implemented:

- homepage with platform stats and featured campaigns
- `/campaigns` listing page for published campaigns
- `/campaigns/[id]` detail page for published campaigns
- category display and progress tracking
- milestone support on campaigns

Behavior:

- only `PUBLISHED` campaigns appear in public campaign queries
- campaign progress is calculated from live donation totals against `goalAmount`

## Donation System

### 2. Simulated Donation Checkout

Implemented:

- staged donation form with donor details, anonymity, supporter access code handling, blob color choice, tax fields, update opt-in, and simulated payment fields
- simulated payment validation with:
  - cardholder name
  - card number validation
  - expiry validation
  - CVC validation
  - optional billing postal code
- receipt generation
- thank-you tier classification
- thank-you action persistence

Business rules:

- donation completion is simulated only; there is no live payment gateway
- supporter access codes can be created or reused
- donor anonymity affects only public visibility, not internal storage

### 3. Donation Post-Processing

Implemented:

- receipt creation for each donation
- thank-you tier classification:
  - `BASIC`
  - `PERSONAL`
  - `FOLLOW_UP`
- thank-you email triggering flow with status tracking
- tax-deduction MVP data capture
- donor update opt-in tracking

## Donor Visualization

### 4. Global Donation Blob Map

Implemented:

- interactive homepage blob field for recent donations
- accessible fallback donation table
- draggable blobs with motion behavior
- campaign identity rendering on blobs when image data is available
- supporter grouping through access-code based magnet behavior

Design constraints respected:

- interaction remains usable with keyboard and accessible labels
- reduced-motion users do not get unnecessary motion
- blob rendering avoids heavy external animation libraries

## Admin Features

### 5. Campaign Administration

Implemented:

- admin campaign list
- create campaign flow
- edit campaign flow
- publish and close lifecycle controls
- milestone management in admin
- campaign analytics surfaces on the edit page
- donation deletion for demo reset workflows

Editable campaign fields:

- title
- slug
- category
- summary
- description
- brand image URL
- goal amount
- milestone set
- celebration mode toggle

### 6. Campaign Request Review

Implemented:

- campaign request submission flow
- admin request review flow
- approval and rejection states
- campaign creation from approved request path

## Analytics

### 7. Campaign Analytics

Implemented:

- raised amount KPI
- donation count KPI
- average donation KPI
- funded percentage KPI
- donation type split
- anonymity split
- daily donation time series
- recent campaign donation activity

Purpose:

- provide a polished analytics-oriented admin surface for demos
- keep campaign performance understandable without a separate analytics backend

## Celebration Mode

### 8. Global Campaign Success Celebration Mode

Implemented:

- campaign-level celebration controls
- automatic completion detection when a donation causes a published campaign to reach its goal
- `completedAt` recorded once when the goal is first reached
- global homepage celebration state driven server-side
- active celebration campaign selection via `getActiveCelebrationCampaign()`

Activation rules:

- a campaign is completed when:
  - `raisedAmount >= goalAmount`
  - `status = PUBLISHED`
- celebration mode activates when at least one completed published campaign has:
  - `celebrationEnabled = true`

Selection behavior:

- the most relevant campaign is the most recently completed eligible campaign
- tie-breaking falls back to `publishedAt`

UI implementations:

- homepage success banner
- hero copy shift into success-state messaging
- gold ambient hero treatment
- subtle shimmer
- lightweight floating particles
- warmer blob treatment

Constraints respected:

- server-side state computation
- CSS-based animation
- no physics changes to blobs
- reduced motion disables shimmer, particles, and pulse

## Terms and Policy

### 9. Terms of Service

Implemented:

- static `/terms-of-service` page
- linked from the homepage
- written as a demo-safe platform policy reference

## Data Model

### 10. Prisma Models in Use

Implemented models include:

- `Campaign`
- `CampaignMilestone`
- `Category`
- `Donation`
- `DonationAccess`
- `DonationReceipt`
- `ThankYouAction`
- `CampaignRequest`
- `AuditEvent`
- `User`

Notable `Campaign` fields:

- `status`
- `goalAmount`
- `brandImageUrl`
- `celebrationEnabled`
- `publishedAt`
- `completedAt`
- `closedAt`

Notable `Donation` fields:

- `donationType`
- `isAnonymous`
- `blobColor`
- `taxEligible`
- `taxId`
- `taxIdType`
- `subscribedToUpdates`
- simulated payment snapshot fields

## Seed Data

### 11. Local Demo Dataset

Implemented:

- categories
- users
- published campaigns
- milestones
- donation history
- receipts
- thank-you actions
- campaign requests
- one completed campaign for homepage celebration-mode demos

Reset path:

- running `npm run db:seed` restores the curated local demo state

## Testing

### 12. Test Coverage Areas

Implemented coverage includes:

- donation validation
- donation flow integration
- supporter access code handling
- thank-you tier logic
- admin campaign management
- analytics behavior
- campaign request flows
- celebration campaign selection
- completion timestamp assignment behavior

Current test types:

- unit tests with Vitest
- integration tests with Vitest
- Playwright e2e support configured in the project

## Implementation Decisions

### 13. Architectural Choices

The project intentionally separates concerns:

- domain helpers stay pure where possible
- services own business rules and transactional updates
- persistence functions shape read data for pages
- route actions stay thin and delegate to services

This keeps features like celebration mode, donation completion, and admin editing from being buried inside page code.

### 14. Performance Decisions

Implemented with performance in mind:

- celebration state is computed on the server
- blob effects remain mostly CSS-driven
- no heavy animation libraries are used
- public list/detail queries are scoped to published campaigns only
- donation success visuals do not add heavy client loops

### 15. Accessibility Decisions

Implemented with accessibility constraints:

- blob map includes accessible labels and fallback table content
- reduced motion is respected
- celebration visuals avoid flashing or aggressive animation
- key public interactions remain readable and non-blocking

## Known MVP Boundaries

The project still intentionally remains an MVP in these areas:

- no real payment processor integration
- no full authentication and authorization stack
- no production-grade email orchestration layer
- no live event streaming or websockets
- no multi-tenant or advanced permission model

## Useful Commands

- install dependencies:
  `npm install`
- generate Prisma client:
  `npm run prisma:generate`
- create local migration during development:
  `npm run prisma:migrate:dev`
- apply checked-in migrations:
  `npx prisma migrate deploy`
- reseed demo data:
  `npm run db:seed`
- start development server:
  `npm run dev`
- run typecheck:
  `npm run typecheck`
- run all tests:
  `npm run test`
