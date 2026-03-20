import Link from "next/link";
import { GlobalDonationBlobMap } from "@/components/global-donation-blob-map";
import { buildLandingStats, pickFeaturedCampaigns, type LandingCampaign, type LandingDonation } from "@/lib/domain/landing";
import { getLandingCampaignData } from "@/lib/persistence/campaign-queries";

const howPulseFundWorksItems = [
  {
    title: "Discover live campaigns",
    text: "Browse verified causes and instantly understand traction through transparent progress and activity."
  },
  {
    title: "Donate in seconds",
    text: "Complete a simple donation flow with one-time or recurring support and optional anonymous visibility."
  },
  {
    title: "See your impact",
    text: "Every donation appears in living visualizations with accessible fallback details for complete clarity."
  },
  {
    title: "Terms of Service",
    text: "Review the site rules, donation conditions, and platform responsibilities before you support a campaign.",
    href: "/terms-of-service",
    linkLabel: "Open terms"
  }
] as const;

function toAmount(value: unknown): number {
  return Number(value);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function HomePage() {
  const rawCampaigns = await getLandingCampaignData();

  const campaigns: LandingCampaign[] = rawCampaigns.map((campaign) => {
    const raisedAmount = campaign.donations.reduce((sum, donation) => sum + toAmount(donation.amount), 0);

    return {
      id: campaign.id,
      slug: campaign.slug,
      title: campaign.title,
      summary: campaign.summary,
      goalAmount: toAmount(campaign.goalAmount),
      raisedAmount,
      donationCount: campaign.donations.length,
      categoryName: campaign.category?.name ?? "Uncategorized"
    };
  });

  const donations: LandingDonation[] = rawCampaigns
    .flatMap((campaign) =>
      campaign.donations.map((donation) => ({
        id: donation.id,
        amount: toAmount(donation.amount),
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
        donationType: donation.donationType,
        blobColor: donation.blobColor,
        donationAccessId: donation.donationAccessId,
        createdAt: donation.createdAt,
        campaignTitle: campaign.title,
        campaignSlug: campaign.slug,
        campaignImageUrl: campaign.brandImageUrl
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 60);

  const stats = buildLandingStats(campaigns, donations);
  const featuredCampaigns = pickFeaturedCampaigns(campaigns);

  return (
    <div className="ui-page-stack">
      <section className="landing-hero relative overflow-hidden rounded-[2rem] border border-white/20 px-6 py-12 md:px-10 md:py-16">
        <div className="landing-hero-glow" />
        <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-2 type-meta text-secondary">
              PulseFund Live
            </p>
            <h1 className="type-hero max-w-3xl">Fund missions with living momentum.</h1>
            <p className="type-body max-w-2xl">
              PulseFund transforms every donation into visible campaign energy. Watch support grow in real time through
              interactive donor blobs and transparent progress tracking.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link className="ui-button-primary" href="/campaigns">
                Start exploring campaigns
              </Link>
              <Link className="ui-button-secondary" href="/my-donations">
                View donor history
              </Link>
            </div>
          </div>

          <div className="landing-panel ui-panel-padding space-y-4">
            <p className="type-meta">Today on PulseFund</p>
            <div className="space-y-2">
              <p className="type-section">{formatCurrency(stats.totalRaised)}</p>
              <p className="type-body-sm">Total raised across active campaigns</p>
            </div>
            <div className="grid gap-2 text-sm text-secondary sm:grid-cols-2">
              <p>Active campaigns: {stats.activeCampaigns}</p>
              <p>Visible donors: {stats.donorCount}</p>
              <p>Recurring gifts: {stats.recurringDonations}</p>
              <p>Tracked donations: {donations.length}</p>
            </div>
          </div>
        </div>
      </section>

      <GlobalDonationBlobMap donations={donations} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total raised", value: formatCurrency(stats.totalRaised) },
          { label: "Active campaigns", value: String(stats.activeCampaigns) },
          { label: "Donors", value: String(stats.donorCount) },
          { label: "Recurring donations", value: String(stats.recurringDonations) }
        ].map((item) => (
          <article className="landing-panel ui-panel-padding space-y-2" key={item.label}>
            <p className="type-meta">{item.label}</p>
            <p className="type-section">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="ui-section-stack">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="ui-section-heading">
            <h2 className="type-section">Featured campaigns</h2>
            <p className="type-body-sm">High-momentum campaigns with active community support.</p>
          </div>
          <Link className="ui-button-secondary" href="/campaigns">
            View all campaigns
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredCampaigns.map((campaign) => {
            const progress = campaign.goalAmount > 0 ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100) : 0;

            return (
              <article className="ui-campaign-card" key={campaign.id}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(94,234,212,0.18),_transparent_52%)]" />
                <div className="ui-campaign-card__content">
                  <p className="ui-card-badge">{campaign.categoryName}</p>
                  <h3 className="type-card">{campaign.title}</h3>
                  <p className="ui-campaign-card__summary">{campaign.summary ?? "Campaign is gathering momentum right now."}</p>
                  <div className="ui-progress-stack">
                    <div className="ui-progress-meta">
                      <span>{formatCurrency(campaign.raisedAmount)} raised</span>
                      <span>{formatCurrency(campaign.goalAmount)} goal</span>
                    </div>
                    <div className="ui-progress-track">
                      <div className="ui-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="ui-card-footer">
                    <span className="type-body-sm">{campaign.donationCount} donations</span>
                    <Link className="ui-button-secondary" href={`/campaigns/${campaign.id}`}>
                      Open campaign
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-panel p-6 md:p-8">
        <h2 className="type-section">How PulseFund works</h2>
        <p className="mt-2 type-body-sm">Scroll the lane or let it glide to explore how the platform works.</p>
        <div className="landing-how-it-works-scroller mt-6">
          <div className="landing-how-it-works-scrollport" role="region" aria-label="How PulseFund works cards">
            <div className="landing-how-it-works-track">
              {[...howPulseFundWorksItems, ...howPulseFundWorksItems].map((item, index) => {
                const isClone = index >= howPulseFundWorksItems.length;

                return (
                  <article
                    aria-hidden={isClone}
                    className="landing-how-it-works-card ui-card-soft p-5"
                    key={`${item.title}-${isClone ? "clone" : "primary"}`}
                  >
                    <div className="space-y-3">
                      <h3 className="type-card">{item.title}</h3>
                      <p className="type-body-sm">{item.text}</p>
                    </div>

                    {"href" in item ? (
                      <div className="mt-5">
                        <Link
                          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-200 underline decoration-teal-200/60 underline-offset-4"
                          href={item.href}
                          tabIndex={isClone ? -1 : undefined}
                        >
                          {item.linkLabel}
                        </Link>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
