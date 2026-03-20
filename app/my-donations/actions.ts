"use server";

import { lookupMyDonationsBySupporterAccessCode } from "@/lib/services/my-donations";

export type MyDonationsFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  supporterAccessCode?: string;
  donations?: Array<{
    donationId: string;
    amount: number;
    donationType: "ONE_TIME" | "RECURRING";
    isAnonymous: boolean;
    donorName: string | null;
    donorEmail: string | null;
    blobColor: string | null;
    createdAt: string;
    campaignId: string;
    campaignTitle: string;
    receiptNumber: string | null;
    receiptIssuedAt: string | null;
  }>;
};

export async function lookupMyDonationsAction(
  _prevState: MyDonationsFormState,
  formData: FormData
): Promise<MyDonationsFormState> {
  try {
    const result = await lookupMyDonationsBySupporterAccessCode({
      supporterAccessCode: String(formData.get("supporterAccessCode") ?? "")
    });

    return {
      status: "success",
      supporterAccessCode: result.supporterAccessCode,
      donations: result.donations.map((donation) => ({
        ...donation,
        createdAt: donation.createdAt.toISOString(),
        receiptIssuedAt: donation.receiptIssuedAt ? donation.receiptIssuedAt.toISOString() : null
      })),
      message:
        result.donations.length > 0
          ? "Donations loaded successfully."
          : "Valid code found, but no donations are attached yet."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not look up donations.";

    return {
      status: "error",
      message
    };
  }
}
