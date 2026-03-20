"use server";

import { createCampaignRequest } from "@/lib/services/campaign-requests";

export type CampaignRequestFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitCampaignRequestAction(
  _prevState: CampaignRequestFormState,
  formData: FormData
): Promise<CampaignRequestFormState> {
  try {
    await createCampaignRequest({
      requesterName: String(formData.get("requesterName") ?? ""),
      requesterEmail: String(formData.get("requesterEmail") ?? ""),
      title: String(formData.get("title") ?? ""),
      category: String(formData.get("category") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      description: String(formData.get("description") ?? ""),
      goalAmount: Number(formData.get("goalAmount") ?? 0),
      motivation: String(formData.get("motivation") ?? "")
    });

    return {
      status: "success",
      message: "Campaign request submitted. Our admin team can now review it in the request queue."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaign request could not be submitted.";

    return {
      status: "error",
      message
    };
  }
}
