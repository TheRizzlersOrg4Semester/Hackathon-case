const { PrismaClient, CampaignStatus, DonationType, ThankYouTier, EmailStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.campaignRequest.deleteMany();
  await prisma.thankYouAction.deleteMany();
  await prisma.donationReceipt.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.donationAccess.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Education",
        slug: "education",
        description: "Support learning resources and youth development."
      }
    }),
    prisma.category.create({
      data: {
        name: "Health",
        slug: "health",
        description: "Improve access to care and wellness services."
      }
    }),
    prisma.category.create({
      data: {
        name: "Environment",
        slug: "environment",
        description: "Fund local sustainability and climate actions."
      }
    })
  ]);

  const [education, health, environment] = categories;

  const [alice, bob] = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@example.com",
        displayName: "Alice Jensen"
      }
    }),
    prisma.user.create({
      data: {
        email: "bob@example.com",
        displayName: "Bob Larsen"
      }
    })
  ]);

  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        title: "Laptops for Future Coders",
        slug: "laptops-for-future-coders",
        summary: "Provide refurbished laptops to 100 students.",
        description:
          "This campaign funds hardware, setup workshops, and mentorship sessions for students entering coding programs.",
        brandImageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80",
        goalAmount: 120000,
        status: CampaignStatus.PUBLISHED,
        publishedAt: new Date("2026-03-01T10:00:00Z"),
        categoryId: education.id,
        milestones: {
          create: [
            {
              title: "First classroom kit",
              description: "Fund the first wave of refurbished laptops and setup materials.",
              targetAmount: 20000,
              displayOrder: 1
            },
            {
              title: "Mentor workshop series",
              description: "Unlock volunteer-led onboarding workshops for students.",
              targetAmount: 50000,
              displayOrder: 2
            },
            {
              title: "Full 100-student rollout",
              description: "Cover the full hardware and support plan for the entire cohort.",
              targetAmount: 90000,
              displayOrder: 3
            }
          ]
        }
      }
    }),
    prisma.campaign.create({
      data: {
        title: "Mobile Health Van Expansion",
        slug: "mobile-health-van-expansion",
        summary: "Expand weekend preventive-care visits.",
        description:
          "Funding supports an extra mobile unit, volunteer coordination, and basic screening kits for underserved areas.",
        brandImageUrl: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=200&q=80",
        goalAmount: 200000,
        status: CampaignStatus.PUBLISHED,
        publishedAt: new Date("2026-02-20T11:00:00Z"),
        categoryId: health.id,
        milestones: {
          create: [
            {
              title: "Weekend staffing boost",
              description: "Add an extra staffed weekend route.",
              targetAmount: 40000,
              displayOrder: 1
            },
            {
              title: "Second mobile unit",
              description: "Put a second van into operation for high-demand districts.",
              targetAmount: 120000,
              displayOrder: 2
            }
          ]
        }
      }
    }),
    prisma.campaign.create({
      data: {
        title: "Community Tree Belt 2026",
        slug: "community-tree-belt-2026",
        summary: "Plant and maintain 1,500 urban trees.",
        description:
          "The project covers saplings, irrigation setup, and neighborhood maintenance events during the first year.",
        brandImageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=200&q=80",
        goalAmount: 90000,
        status: CampaignStatus.PUBLISHED,
        publishedAt: new Date("2026-03-10T09:30:00Z"),
        categoryId: environment.id,
        milestones: {
          create: [
            {
              title: "Planting kickoff",
              description: "Secure the first set of saplings and volunteer tools.",
              targetAmount: 15000,
              displayOrder: 1
            },
            {
              title: "Irrigation installation",
              description: "Install the water infrastructure for long-term care.",
              targetAmount: 45000,
              displayOrder: 2
            }
          ]
        }
      }
    }),
    prisma.campaign.create({
      data: {
        title: "Neighborhood Learning Corner",
        slug: "neighborhood-learning-corner",
        summary: "Build a shared learning space with books and laptops.",
        description:
          "This campaign is newly published and currently has no donations, which helps demo empty-state behavior.",
        brandImageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=200&q=80",
        goalAmount: 45000,
        status: CampaignStatus.PUBLISHED,
        publishedAt: new Date("2026-03-16T09:00:00Z"),
        categoryId: education.id
      }
    })
  ]);

  const [campaignA, campaignB, campaignC, campaignD] = campaigns;

  const [supporterAccessA, supporterAccessB, supporterAccessC] = await Promise.all([
    prisma.donationAccess.create({
      data: {
        accessCode: "PF-ALICE-4721"
      }
    }),
    prisma.donationAccess.create({
      data: {
        accessCode: "PF-GUEST-8193"
      }
    }),
    prisma.donationAccess.create({
      data: {
        accessCode: "PF-COMM-5584"
      }
    })
  ]);

  const donations = await Promise.all([
    prisma.donation.create({
      data: {
        campaignId: campaignA.id,
        userId: alice.id,
        donationAccessId: supporterAccessA.id,
        amount: 1500,
        donorName: "Alice Jensen",
        donorEmail: "alice@example.com",
        subscribedToUpdates: true,
        blobColor: "#4DD2FF",
        isAnonymous: false,
        donationType: DonationType.ONE_TIME,
        donorMessage: "Happy to support this program.",
        createdAt: new Date("2026-03-12T08:15:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignA.id,
        donationAccessId: supporterAccessB.id,
        amount: 300,
        donorName: "Private Donor",
        donorEmail: "private.donor@example.com",
        subscribedToUpdates: false,
        blobColor: "#7A5CFA",
        isAnonymous: true,
        donationType: DonationType.ONE_TIME,
        createdAt: new Date("2026-03-13T13:25:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignB.id,
        userId: bob.id,
        donationAccessId: supporterAccessA.id,
        amount: 2500,
        donorName: "Bob Larsen",
        donorEmail: "bob@example.com",
        subscribedToUpdates: true,
        blobColor: "#2FD39A",
        isAnonymous: false,
        donationType: DonationType.RECURRING,
        createdAt: new Date("2026-03-09T10:05:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignC.id,
        donationAccessId: supporterAccessB.id,
        amount: 800,
        donorName: null,
        donorEmail: "guest.supporter@example.com",
        subscribedToUpdates: false,
        blobColor: "#F46D9B",
        isAnonymous: false,
        donationType: DonationType.ONE_TIME,
        createdAt: new Date("2026-03-15T16:40:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignA.id,
        donationAccessId: supporterAccessC.id,
        amount: 620,
        donorName: "Jonas Madsen",
        donorEmail: "jonas.madsen@example.com",
        subscribedToUpdates: true,
        blobColor: "#8B5CF6",
        isAnonymous: false,
        donationType: DonationType.RECURRING,
        createdAt: new Date("2026-03-16T09:15:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignB.id,
        donationAccessId: supporterAccessB.id,
        amount: 420,
        donorName: "Anonymous Hero",
        donorEmail: "hero@example.com",
        subscribedToUpdates: false,
        blobColor: "#FFA84E",
        isAnonymous: true,
        donationType: DonationType.ONE_TIME,
        createdAt: new Date("2026-03-16T11:45:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignC.id,
        donationAccessId: supporterAccessC.id,
        amount: 1100,
        donorName: "Mia Christensen",
        donorEmail: "mia.christensen@example.com",
        subscribedToUpdates: true,
        blobColor: "#1EC7B5",
        isAnonymous: false,
        donationType: DonationType.ONE_TIME,
        createdAt: new Date("2026-03-16T14:20:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignD.id,
        donationAccessId: supporterAccessA.id,
        amount: 350,
        donorName: "Alice Jensen",
        donorEmail: "alice@example.com",
        subscribedToUpdates: true,
        blobColor: "#BEEA64",
        isAnonymous: false,
        donationType: DonationType.ONE_TIME,
        createdAt: new Date("2026-03-16T17:05:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignD.id,
        donationAccessId: supporterAccessB.id,
        amount: 180,
        donorName: null,
        donorEmail: "quiet.supporter@example.com",
        subscribedToUpdates: false,
        blobColor: "#FF5F7E",
        isAnonymous: true,
        donationType: DonationType.ONE_TIME,
        createdAt: new Date("2026-03-17T08:35:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignB.id,
        donationAccessId: supporterAccessC.id,
        amount: 980,
        donorName: "Freja Nielsen",
        donorEmail: "freja.nielsen@example.com",
        subscribedToUpdates: true,
        blobColor: "#4B7CFF",
        isAnonymous: false,
        donationType: DonationType.RECURRING,
        createdAt: new Date("2026-03-17T13:10:00Z")
      }
    }),
    prisma.donation.create({
      data: {
        campaignId: campaignA.id,
        donationAccessId: supporterAccessB.id,
        amount: 260,
        donorName: "Local Business Sponsor",
        donorEmail: "sponsor@example.com",
        subscribedToUpdates: false,
        blobColor: "#FFC764",
        isAnonymous: true,
        donationType: DonationType.ONE_TIME,
        createdAt: new Date("2026-03-17T15:55:00Z")
      }
    })
  ]);

  await Promise.all(
    donations.map((donation, index) =>
      prisma.donationReceipt.create({
        data: {
          donationId: donation.id,
          receiptNumber: `RCPT-2026-${String(index + 1).padStart(4, "0")}`,
          totalAmount: donation.amount
        }
      })
    )
  );

  await Promise.all(
    donations.map((donation) =>
      prisma.thankYouAction.create({
        data: {
          donationId: donation.id,
          tier:
            Number(donation.amount) < 200
              ? ThankYouTier.BASIC
              : Number(donation.amount) <= 1000
                ? ThankYouTier.PERSONAL
                : ThankYouTier.FOLLOW_UP,
          emailStatus: EmailStatus.PENDING
        }
      })
    )
  );

  await prisma.auditEvent.createMany({
    data: [
      {
        eventType: "campaign_published",
        entityType: "campaign",
        entityId: campaignA.id,
        metadata: { channel: "seed", note: "sanitized" }
      },
      {
        eventType: "donation_created",
        entityType: "donation",
        entityId: donations[0].id,
        metadata: { channel: "seed", amountBand: "1000_plus" }
      }
    ]
  });

  await prisma.campaignRequest.createMany({
    data: [
      {
        requesterName: "Nora Pedersen",
        requesterEmail: "nora.pedersen@example.com",
        title: "After-school Robotics Lab",
        category: "Education",
        summary: "Launch a neighborhood robotics lab for teens.",
        description:
          "We need starter kits, spare parts, and weekly mentor time to run a free robotics lab for 40 local students.",
        goalAmount: 65000,
        motivation: "Hands-on STEM access is still limited in our area and this lab can close that gap quickly."
      },
      {
        requesterName: "Jonas Madsen",
        requesterEmail: "jonas.madsen@example.com",
        title: "Rain Garden for Schoolyard",
        category: "Environment",
        summary: "Build rain gardens to reduce flooding in a schoolyard.",
        description:
          "This project funds design support, soil work, and native plants to handle stormwater and improve local biodiversity.",
        goalAmount: 42000,
        motivation: "Students can help maintain the site and learn climate adaptation in practice."
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
