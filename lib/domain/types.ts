export type CampaignStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type DonationType = "ONE_TIME" | "RECURRING";

export type ThankYouTier = "BASIC" | "PERSONAL" | "FOLLOW_UP";

export interface LightweightDomainEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}
