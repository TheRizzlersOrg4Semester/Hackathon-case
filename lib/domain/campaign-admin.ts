export type CampaignLifecycleStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export function canTransitionCampaignStatus(
  currentStatus: CampaignLifecycleStatus,
  nextStatus: CampaignLifecycleStatus
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "DRAFT" && nextStatus === "PUBLISHED") {
    return true;
  }

  if (currentStatus === "PUBLISHED" && nextStatus === "CLOSED") {
    return true;
  }

  return false;
}

export function assertCampaignStatusTransition(
  currentStatus: CampaignLifecycleStatus,
  nextStatus: CampaignLifecycleStatus
): void {
  if (!canTransitionCampaignStatus(currentStatus, nextStatus)) {
    throw new Error(`Campaign cannot transition from ${currentStatus} to ${nextStatus}.`);
  }
}
