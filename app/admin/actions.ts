"use server";

import { CampaignStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCampaignByAdmin,
  deleteDonationByAdmin,
  transitionCampaignStatusByAdmin,
  updateCampaignByAdmin
} from "@/lib/services/admin-campaigns";
import { reviewCampaignRequest } from "@/lib/services/campaign-requests";

function readCampaignFormData(formData: FormData) {
  const milestoneIds = formData.getAll("milestoneId");
  const milestoneTitles = formData.getAll("milestoneTitle");
  const milestoneDescriptions = formData.getAll("milestoneDescription");
  const milestoneTargetAmounts = formData.getAll("milestoneTargetAmount");
  const milestoneDisplayOrders = formData.getAll("milestoneDisplayOrder");
  const milestoneRowCount = Math.max(
    milestoneIds.length,
    milestoneTitles.length,
    milestoneDescriptions.length,
    milestoneTargetAmounts.length,
    milestoneDisplayOrders.length
  );

  const milestones = Array.from({ length: milestoneRowCount }, (_, index) => ({
    id: String(milestoneIds[index] ?? ""),
    title: String(milestoneTitles[index] ?? "").trim(),
    description: String(milestoneDescriptions[index] ?? "").trim(),
    targetAmount: Number(milestoneTargetAmounts[index] ?? 0),
    displayOrder: Number(milestoneDisplayOrders[index] ?? index + 1)
  })).filter((milestone) => milestone.title.length > 0 || milestone.description.length > 0 || milestone.targetAmount > 0);

  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    description: String(formData.get("description") ?? ""),
    goalAmount: Number(formData.get("goalAmount") ?? 0),
    celebrationEnabled: formData.get("celebrationEnabled") === "on",
    brandImageUrl: String(formData.get("brandImageUrl") ?? ""),
    milestones
  };
}

export async function createCampaignAction(formData: FormData) {
  const result = await createCampaignByAdmin(readCampaignFormData(formData));

  revalidatePath("/admin");
  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${result.campaignId}/edit`);
}

export async function updateCampaignAction(campaignId: string, formData: FormData) {
  await updateCampaignByAdmin(campaignId, readCampaignFormData(formData));

  revalidatePath("/admin");
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}/edit`);
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function publishCampaignAction(campaignId: string) {
  await transitionCampaignStatusByAdmin(campaignId, CampaignStatus.PUBLISHED);

  revalidatePath("/admin");
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}/edit`);
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function closeCampaignAction(campaignId: string) {
  await transitionCampaignStatusByAdmin(campaignId, CampaignStatus.CLOSED);

  revalidatePath("/admin");
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}/edit`);
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function deleteDonationAction(campaignId: string, donationId: string) {
  await deleteDonationByAdmin(donationId);

  revalidatePath("/admin");
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}/edit`);
  revalidatePath("/");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function reviewCampaignRequestAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (decision !== "APPROVED" && decision !== "REJECTED") {
    throw new Error("Invalid campaign request review decision.");
  }

  await reviewCampaignRequest({
    requestId,
    decision
  });

  revalidatePath("/admin");
  revalidatePath("/admin/campaign-requests");
  revalidatePath("/admin/campaigns");
}
