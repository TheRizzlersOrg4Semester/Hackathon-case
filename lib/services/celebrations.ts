import { CampaignStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/persistence/prisma";

type CelebrationCampaignCandidate = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  celebrationEnabled: boolean;
  status: CampaignStatus;
  goalAmount: Prisma.Decimal;
  completedAt: Date | null;
  publishedAt: Date | null;
  donations: Array<{ amount: Prisma.Decimal }>;
};

export type ActiveCelebrationCampaign = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  goalAmount: number;
  raisedAmount: number;
  completedAt: Date;
};

export type CelebrationPersistence = {
  getCelebrationCandidates: () => Promise<CelebrationCampaignCandidate[]>;
};

function toAmount(value: Prisma.Decimal): number {
  return Number(value);
}

function isCampaignCompleted(candidate: CelebrationCampaignCandidate): boolean {
  const raisedAmount = candidate.donations.reduce((sum, donation) => sum + toAmount(donation.amount), 0);
  return raisedAmount >= toAmount(candidate.goalAmount);
}

function getDefaultCelebrationPersistence(): CelebrationPersistence {
  return {
    async getCelebrationCandidates() {
      return prisma.campaign.findMany({
        where: {
          status: CampaignStatus.PUBLISHED,
          celebrationEnabled: true,
          completedAt: {
            not: null
          }
        },
        orderBy: [{ completedAt: "desc" }, { publishedAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          celebrationEnabled: true,
          status: true,
          goalAmount: true,
          completedAt: true,
          publishedAt: true,
          donations: {
            select: {
              amount: true
            }
          }
        }
      });
    }
  };
}

export async function getActiveCelebrationCampaign(
  deps?: {
    persistence?: CelebrationPersistence;
  }
): Promise<ActiveCelebrationCampaign | null> {
  const persistence = deps?.persistence ?? getDefaultCelebrationPersistence();
  const candidates = await persistence.getCelebrationCandidates();
  const sortedCandidates = [...candidates].sort((left, right) => {
    const completedDelta = (right.completedAt?.getTime() ?? 0) - (left.completedAt?.getTime() ?? 0);

    if (completedDelta !== 0) {
      return completedDelta;
    }

    return (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0);
  });

  for (const candidate of sortedCandidates) {
    if (
      candidate.status !== CampaignStatus.PUBLISHED ||
      !candidate.celebrationEnabled ||
      !candidate.completedAt ||
      !isCampaignCompleted(candidate)
    ) {
      continue;
    }

    const raisedAmount = candidate.donations.reduce((sum, donation) => sum + toAmount(donation.amount), 0);

    return {
      id: candidate.id,
      slug: candidate.slug,
      title: candidate.title,
      summary: candidate.summary,
      goalAmount: toAmount(candidate.goalAmount),
      raisedAmount,
      completedAt: candidate.completedAt
    };
  }

  return null;
}
