import { prisma } from "@/lib/persistence/prisma";

export async function getTaxEligibleDonationsForYear(year: number) {
  const rangeStart = new Date(Date.UTC(year, 0, 1));
  const rangeEnd = new Date(Date.UTC(year + 1, 0, 1));

  return prisma.donation.findMany({
    where: {
      taxEligible: true,
      taxId: {
        not: null
      },
      taxIdType: {
        not: null
      },
      createdAt: {
        gte: rangeStart,
        lt: rangeEnd
      }
    },
    orderBy: [
      {
        createdAt: "desc"
      }
    ],
    select: {
      amount: true,
      createdAt: true,
      taxId: true,
      taxIdType: true
    }
  });
}
