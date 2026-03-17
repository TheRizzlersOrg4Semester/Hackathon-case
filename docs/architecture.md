# PulseFund Architecture Overview

PulseFund v1 is a monolith designed for deployment on a single Azure VM.

## Layers

1. UI Layer (`app`, `components`)
2. Application/Service Layer (`lib/services`)
3. Domain Layer (`lib/domain`)
4. Persistence Layer (`lib/persistence`, `prisma`)

## Design Principles

- favor readability and explainability for live demo use
- avoid premature microservices
- keep dependencies stable and minimal
- preserve clear boundaries between domain rules and infrastructure code

## Logging and Compliance Notes

- use lightweight domain-event logging via `AuditEvent`
- `AuditEvent.metadata` must contain sanitized metadata only
- anonymous donations may still retain internal donor data for operational needs
- public display must never reveal donor identity when `isAnonymous = true`
- simulate reporting workflows; no real public-authority integrations
