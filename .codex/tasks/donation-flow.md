# Implement Donation Flow

Implement the donation flow for PulseFund.

Context:

The system already contains campaigns.

Users must be able to:

- donate to a campaign
- choose anonymous donation
- select one-time or recurring donation
- simulate payment

Requirements:

Store:

- donation amount
- donor name or anonymous
- campaign id
- timestamp
- donation type

Generate:

- receipt record
- thank-you tier classification

Donation tiers:

Under 200 DKK → basic thank-you  
200–1000 DKK → personal thank-you  
Over 1000 DKK → follow-up flag

Deliver:

- database schema updates
- API route
- UI form
- tests for donation logic