"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDonationWithSimulatedPayment } from "@/lib/services/donations";

const donationFormSchema = z.object({
  amount: z.coerce.number().positive(),
  donationType: z.enum(["ONE_TIME", "RECURRING"]).default("ONE_TIME"),
  isAnonymous: z.boolean().default(false),
  donorName: z.string().optional(),
  donorEmail: z.string().optional(),
  taxEligible: z.boolean().default(false),
  taxIdType: z.enum(["CPR", "CVR"]).optional(),
  taxId: z.string().optional(),
  accessCodeMode: z.enum(["CREATE_NEW", "USE_EXISTING"]).default("CREATE_NEW"),
  supporterAccessCode: z.string().optional(),
  blobColor: z.string().optional()
});

export type DonationFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  receiptNumber?: string;
  paymentReference?: string;
  thankYouTier?: string;
  thankYouEmailStatus?: "skipped" | "triggered" | "failed";
  thankYouEmailMessage?: string;
  supporterAccessCode?: string;
  supporterAccessCodeCreated?: boolean;
};

export async function submitDonationAction(
  campaignId: string,
  _prevState: DonationFormState,
  formData: FormData
): Promise<DonationFormState> {
  const getOptionalString = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };

  const parsed = donationFormSchema.safeParse({
    amount: formData.get("amount"),
    donationType: formData.get("donationType"),
    isAnonymous: formData.get("isAnonymous") === "on",
    donorName: getOptionalString("donorName"),
    donorEmail: getOptionalString("donorEmail"),
    taxEligible: formData.get("taxEligible") === "on",
    taxIdType: getOptionalString("taxIdType"),
    taxId: getOptionalString("taxId"),
    accessCodeMode: formData.get("accessCodeMode"),
    supporterAccessCode: getOptionalString("supporterAccessCode"),
    blobColor: getOptionalString("blobColor")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please review the donation form fields."
    };
  }

  try {
    const result = await createDonationWithSimulatedPayment({
      campaignId,
      amount: parsed.data.amount,
      donationType: parsed.data.donationType,
      isAnonymous: parsed.data.isAnonymous,
      donorName: parsed.data.donorName,
      donorEmail: parsed.data.donorEmail,
      taxEligible: parsed.data.taxEligible,
      taxIdType: parsed.data.taxIdType,
      taxId: parsed.data.taxId,
      accessCodeMode: parsed.data.accessCodeMode,
      supporterAccessCode: parsed.data.supporterAccessCode,
      blobColor: parsed.data.blobColor
    });

    revalidatePath("/");
    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${campaignId}/edit`);
    revalidatePath("/my-donations");

    return {
      status: "success",
      message: "Donation completed with simulated payment. Save your Supporter Access Code for My Donations lookup.",
      receiptNumber: result.receiptNumber,
      paymentReference: result.paymentReference,
      thankYouTier: result.thankYouTier,
      thankYouEmailStatus: result.thankYouEmailDelivery.status,
      thankYouEmailMessage: result.thankYouEmailDelivery.message,
      supporterAccessCode: result.supporterAccessCode,
      supporterAccessCodeCreated: result.supporterAccessCodeCreated
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Donation could not be completed.";

    return {
      status: "error",
      message
    };
  }
}
