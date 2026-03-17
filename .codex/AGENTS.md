# PulseFund – Codex Agent Rules

This repository contains the PulseFund donations platform.

PulseFund is a modern donation platform that visualizes campaign momentum and donor engagement using an interactive donor visualization ("donor blobs").

The system must remain academically explainable and suitable for a live demo.

---

## Architecture

Version 1 must remain a **monolith**.

Deployment target:
- Single Azure VM

Architecture layers:

UI Layer  
Application / Service Layer  
Domain Layer  
Persistence Layer  

Avoid premature microservices.

Future version (v2) may extract services such as:

- Donation processing
- Email / notifications
- Analytics

---

## Tech Stack

Frontend + backend: **Next.js (App Router)**  
Language: **TypeScript**

Styling:
- Tailwind CSS
- shadcn/ui where helpful

Database:
- PostgreSQL
- Prisma ORM

Validation:
- Zod

Testing:
- Vitest
- Testing Library
- Playwright

---

## Core Product Features

The MVP must include:

- Campaign listing
- Campaign detail page
- Donation flow
- Anonymous donation option
- Donation history
- Donation receipts
- Campaign creation/admin
- Tiered thank-you email logic
- Campaign progress tracking

---

## Wow Feature

Each donation appears as an **interactive donor blob**.

Blob properties:

- size proportional to donation amount
- hover/click interaction
- shows donor information
- supports anonymous donors
- responsive layout

Accessibility requirement:

All blob information must also be available in a normal list/table.

---

## Development Principles

Prefer:

- simple solutions
- stable libraries
- readable code

Avoid:

- experimental frameworks
- premature abstractions
- unnecessary dependencies

---

## Testing Requirements

Critical logic must have tests.

Examples:

- donation tier logic
- campaign progress calculation
- anonymity handling
- receipt generation

---

## Compliance

Do NOT implement real integrations with public authorities.

Instead:

- simulate tax reporting
- model necessary data
- document GDPR-sensitive fields

---

## Logging

Log important domain events:

- campaign created
- campaign published
- donation created
- receipt generated
- email triggered

Never log sensitive personal data.

---

## Accessibility

The UI must:

- support keyboard navigation
- have visible focus states
- have adequate color contrast
- remain usable without animations

---

## Engineering Goal

Build a **clear, testable, demo-ready system**.

The project must be easy to explain in terms of:

- architecture
- testing strategy
- DevOps setup
- AI-assisted development