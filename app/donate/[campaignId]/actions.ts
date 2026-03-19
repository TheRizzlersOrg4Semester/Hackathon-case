"use server";

import { z } from "zod";
import { createDonationWithSimulatedPayment } from "@/lib/services/donations";

const donationFormSchema = z.object({
  amount: z.coerce.number().positive(),
  donationType: z.enum(["ONE_TIME", "RECURRING"]).default("ONE_TIME"),
  isAnonymous: z.boolean().default(false),
  donorName: z.string().optional(),
  donorEmail: z.string().optional(),
  accessCodeMode: z.enum(["CREATE_NEW", "USE_EXISTING"]).default("CREATE_NEW"),
  supporterAccessCode: z.string().optional(),
  blobColor: z.string().optional(),
  paymentCardholderName: z.string().min(1),
  paymentCardNumber: z.string().min(1),
  paymentExpiryMonth: z.coerce.number().int().min(1).max(12),
  paymentExpiryYear: z.coerce.number().int().min(2000).max(2100),
  paymentCvc: z.string().min(3),
  paymentBillingPostalCode: z.string().optional()
});

export type DonationFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  receiptNumber?: string;
  paymentReference?: string;
  paymentCardBrand?: string;
  paymentCardLast4?: string;
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
    accessCodeMode: formData.get("accessCodeMode"),
    supporterAccessCode: getOptionalString("supporterAccessCode"),
    blobColor: getOptionalString("blobColor"),
    paymentCardholderName: getOptionalString("paymentCardholderName"),
    paymentCardNumber: getOptionalString("paymentCardNumber"),
    paymentExpiryMonth: formData.get("paymentExpiryMonth"),
    paymentExpiryYear: formData.get("paymentExpiryYear"),
    paymentCvc: getOptionalString("paymentCvc"),
    paymentBillingPostalCode: getOptionalString("paymentBillingPostalCode")
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
      accessCodeMode: parsed.data.accessCodeMode,
      supporterAccessCode: parsed.data.supporterAccessCode,
      blobColor: parsed.data.blobColor,
      paymentCardholderName: parsed.data.paymentCardholderName,
      paymentCardNumber: parsed.data.paymentCardNumber,
      paymentExpiryMonth: parsed.data.paymentExpiryMonth,
      paymentExpiryYear: parsed.data.paymentExpiryYear,
      paymentCvc: parsed.data.paymentCvc,
      paymentBillingPostalCode: parsed.data.paymentBillingPostalCode
    });

    return {
      status: "success",
      message: "Donation completed with simulated payment. Save your Supporter Access Code for My Donations lookup.",
      receiptNumber: result.receiptNumber,
      paymentReference: result.paymentReference,
      paymentCardBrand: result.paymentCardBrand,
      paymentCardLast4: result.paymentCardLast4,
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
