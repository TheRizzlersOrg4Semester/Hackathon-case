# Phase 2 Acceptance Criteria

These criteria must be confirmed per feature before implementation begins.

## 1) Base App Shell and Routing

- Next.js app boots successfully with shared layout and top-level navigation.
- Placeholder pages exist for all planned MVP routes without business logic.
- Route naming reflects approved domain terms and split donation history structure.

## 2) Campaign Listing + Category Filtering

- Campaign list route is present and connected to a data-access boundary (not direct DB calls in UI).
- Category model exists in schema and can be linked to campaigns.
- Filtering behavior requirements are documented before UI implementation.

## 3) Campaign Detail

- Detail route scaffold supports campaign-level data loading boundaries.
- Detail scope explicitly reserves sections for progress, donation feed, donor blobs, and fallback table/list.
- No donor visualization logic is implemented until criteria for performance and accessibility are signed off.

## 4) Donation Flow

- Donation route scaffold is in place with clear placeholder for:
- amount
- donor identity/anonymity
- donation type (one-time or recurring)
- simulated payment confirmation
- Schema supports all required donation fields and relations.

## 5) Donation History Split

- Separate route scaffolds exist for:
- campaign donation feed
- user donation history
- Data ownership rules are documented for each history type.

## 6) Donation Receipts and Thank-You Logic

- `DonationReceipt` naming is used consistently in schema and docs.
- Thank-you tier enum exists for under-200, 200-1000, and over-1000 thresholds.
- Receipt and thank-you logic remain unimplemented until test-first criteria are defined.

## 7) Admin (Minimal Scope)

- Admin scaffold includes only:
- create campaign
- edit basic fields
- publish campaign
- close campaign
- No broader CMS or complex workflow tooling is introduced.

## 8) Lightweight Domain Event Logging

- `AuditEvent` remains lightweight and generic.
- Event metadata is optional and sanitized.
- No full audit/compliance subsystem behavior is introduced in Phase 2 scaffold.

## 9) Minimal Authentication

- Auth documentation explicitly limits MVP scope to minimal sign-in/session handling.
- User model supports donation history ownership without advanced auth features.
- No overengineered auth provider abstractions are introduced in scaffold phase.

## 10) Testing Scaffold

- `tests/unit`, `tests/integration`, and `tests/e2e` directories exist.
- Test intent per layer is documented.
- No broad feature implementation starts without matching test plan updates.
