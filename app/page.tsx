import Link from "next/link";
import { GlobalDonationBlobMap } from "@/components/global-donation-blob-map";
import { buildLandingStats, pickFeaturedCampaigns, type LandingCampaign, type LandingDonation } from "@/lib/domain/landing";
import { getLandingCampaignData } from "@/lib/persistence/campaign-queries";

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
    <div className="space-y-8">
      <section className="landing-hero relative overflow-hidden rounded-[2rem] border border-white/20 px-6 py-12 md:px-10 md:py-16">
        <div className="landing-hero-glow" />
        <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
              PulseFund Live
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl">
              Fund missions with living momentum.
            </h1>
            <p className="max-w-2xl text-base text-slate-100/90 md:text-lg">
              PulseFund transforms every donation into visible campaign energy. Watch support grow in real time through
              interactive donor blobs and transparent progress tracking.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg" href="/campaigns">
                Start exploring campaigns
              </Link>
              <Link className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur" href="/my-donations">
                View donor history
              </Link>
            </div>
          </div>

          <div className="landing-panel space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Today on PulseFund</p>
            <div className="space-y-2">
              <p className="text-4xl font-semibold text-white">{formatCurrency(stats.totalRaised)}</p>
              <p className="text-sm text-slate-300">Total raised across active campaigns</p>
            </div>
            <div className="grid gap-2 text-sm text-slate-100 sm:grid-cols-2">
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
          <article className="landing-panel space-y-2 p-5" key={item.label}>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</p>
            <p className="text-3xl font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Featured campaigns</h2>
            <p className="text-slate-600">High-momentum campaigns with active community support.</p>
          </div>
          <Link className="text-sm font-medium text-brand-700 underline" href="/campaigns">
            View all campaigns
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredCampaigns.map((campaign) => {
            const progress = campaign.goalAmount > 0 ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100) : 0;

            return (
              <article className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900 p-5 shadow-xl" key={campaign.id}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(94,234,212,0.18),_transparent_52%)]" />
                <div className="relative space-y-4">
                  <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-slate-200">
                    {campaign.categoryName}
                  </p>
                  <h3 className="text-xl font-semibold text-white">{campaign.title}</h3>
                  <p className="text-sm text-slate-300">{campaign.summary ?? "Campaign is gathering momentum right now."}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{formatCurrency(campaign.raisedAmount)} raised</span>
                      <span>{formatCurrency(campaign.goalAmount)} goal</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-300 via-sky-300 to-indigo-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <span>{campaign.donationCount} donations</span>
                    <Link className="font-semibold text-white underline" href={`/campaigns/${campaign.id}`}>
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
        <h2 className="text-3xl font-semibold text-white">How PulseFund works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
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
            }
          ].map((item) => (
            <article className="rounded-2xl border border-white/20 bg-white/5 p-4" key={item.title}>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-200">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
