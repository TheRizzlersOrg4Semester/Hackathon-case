import { z } from "zod";
import { isSupporterAccessCodeFormatValid, normalizeSupporterAccessCode } from "@/lib/domain/access-codes";
import { prisma } from "@/lib/persistence/prisma";

const lookupSchema = z.object({
  supporterAccessCode: z.string().trim().min(1)
});

export type DonationLookupInput = z.input<typeof lookupSchema>;

export type DonationLookupItem = {
  donationId: string;
  amount: number;
  donationType: "ONE_TIME" | "RECURRING";
  isAnonymous: boolean;
  donorName: string | null;
  donorEmail: string | null;
  blobColor: string | null;
  createdAt: Date;
  campaignId: string;
  campaignTitle: string;
  receiptNumber: string | null;
  receiptIssuedAt: Date | null;
};

type DonationLookupPersistence = {
  getDonationAccessByCode: (
    supporterAccessCode: string
  ) => Promise<
    | {
        id: string;
        accessCode: string;
        donations: Array<{
          id: string;
          amount: unknown;
          donationType: "ONE_TIME" | "RECURRING";
          isAnonymous: boolean;
          donorName: string | null;
          donorEmail: string | null;
          blobColor: string | null;
          createdAt: Date;
          campaign: {
            id: string;
            title: string;
          };
          receipt: {
            receiptNumber: string;
            issuedAt: Date;
          } | null;
        }>;
      }
    | null
  >;
};

function getDefaultPersistence(): DonationLookupPersistence {
  return {
    async getDonationAccessByCode(supporterAccessCode) {
      return prisma.donationAccess.findUnique({
        where: {
          accessCode: supporterAccessCode
        },
        select: {
          id: true,
          accessCode: true,
          donations: {
            orderBy: {
              createdAt: "desc"
            },
            select: {
              id: true,
              amount: true,
              donationType: true,
              isAnonymous: true,
              donorName: true,
              donorEmail: true,
              blobColor: true,
              createdAt: true,
              campaign: {
                select: {
                  id: true,
                  title: true
                }
              },
              receipt: {
                select: {
                  receiptNumber: true,
                  issuedAt: true
                }
              }
            }
          }
        }
      });
    }
  };
}

function toAmount(value: unknown): number {
  return Number(value);
}

export async function lookupMyDonationsBySupporterAccessCode(
  input: DonationLookupInput,
  deps?: {
    persistence?: DonationLookupPersistence;
  }
): Promise<{ supporterAccessCode: string; donations: DonationLookupItem[] }> {
  const validated = lookupSchema.parse(input);
  const normalizedCode = normalizeSupporterAccessCode(validated.supporterAccessCode);

  if (!isSupporterAccessCodeFormatValid(normalizedCode)) {
    throw new Error("Supporter Access Code format is invalid.");
  }

  const persistence = deps?.persistence ?? getDefaultPersistence();
  const access = await persistence.getDonationAccessByCode(normalizedCode);

  if (!access) {
    throw new Error("Supporter Access Code was not found.");
  }

  return {
    supporterAccessCode: access.accessCode,
    donations: access.donations.map((donation) => ({
      donationId: donation.id,
      amount: toAmount(donation.amount),
      donationType: donation.donationType,
      isAnonymous: donation.isAnonymous,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      blobColor: donation.blobColor,
      createdAt: donation.createdAt,
      campaignId: donation.campaign.id,
      campaignTitle: donation.campaign.title,
      receiptNumber: donation.receipt?.receiptNumber ?? null,
      receiptIssuedAt: donation.receipt?.issuedAt ?? null
    }))
  };
}
