# Service Layer Scaffold

This folder will contain application use-cases and orchestration logic.

Planned responsibilities:

- campaign lifecycle actions (create, edit basic fields, publish, close)
- donation orchestration (simulate payment, classify thank-you tier, trigger receipt generation)
- logging lightweight domain events

Domain rules should remain in `lib/domain`, while database operations belong in `lib/persistence`.
