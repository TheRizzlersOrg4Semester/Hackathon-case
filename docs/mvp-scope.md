# MVP Scope (Current Baseline)

## Included Scope

- campaign listing
- campaign detail
- donation flow (including anonymous option)
- donation history split into:
- campaign donation feed
- user donation history
- donation receipt records (`DonationReceipt`)
- minimal admin actions:
- create campaign
- edit basic fields
- publish campaign
- close campaign
- donor blob visualization with accessible fallback list/table
- category support for campaign filtering

## Explicitly Minimal / Deferred

- advanced authentication and authorization
- external payment gateways (simulated payment only)
- public authority integrations
- advanced analytics subsystem
- `CampaignProgressSnapshot` model (optional future addition)
