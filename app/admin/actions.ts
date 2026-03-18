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
  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    description: String(formData.get("description") ?? ""),
    goalAmount: Number(formData.get("goalAmount") ?? 0)
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
