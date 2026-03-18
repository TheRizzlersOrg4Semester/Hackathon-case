import Link from "next/link";
import { notFound } from "next/navigation";
import { DonorBlobVisualization } from "@/components/donor-blob-visualization";
import { calculateCampaignProgress, getPublicDonorDisplayName } from "@/lib/domain/campaigns";
import { getPublishedCampaignById } from "@/lib/persistence/campaign-queries";

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;
  const campaign = await getPublishedCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const progress = calculateCampaignProgress(
    toAmount(campaign.goalAmount),
    campaign.donations.map((donation) => ({ amount: toAmount(donation.amount) }))
  );
  const publicDonations = campaign.donations.map((donation) => ({
    id: donation.id,
    amount: toAmount(donation.amount),
    donorName: donation.donorName,
    isAnonymous: donation.isAnonymous,
    donationType: donation.donationType,
    blobColor: donation.blobColor,
    campaignImageUrl: campaign.brandImageUrl,
    campaignTitle: campaign.title,
    accessGroupKey: donation.donationAccessId,
    campaignScopeKey: campaign.id,
    createdAt: donation.createdAt
  }));

  return (
    <section className="space-y-8">
      <div className="campaign-detail-hero relative overflow-hidden rounded-[2rem] border border-white/20 px-6 py-8 md:px-8 md:py-10">
        <div className="campaign-detail-hero-glow" />
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100 backdrop-blur" href="/campaigns">
              Back to campaigns
            </Link>
            <Link className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg" href={`/donate/${campaign.id}`}>
              Make a donation
            </Link>
          </div>

          <div className="space-y-3">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-slate-200">
              {campaign.category?.name ?? "Uncategorized"}
            </p>
            <h1 className="max-w-4xl text-3xl font-semibold text-white md:text-5xl">{campaign.title}</h1>
            <p className="max-w-3xl text-slate-200">{campaign.summary ?? "No summary provided."}</p>
          </div>

          <p className="max-w-4xl text-sm leading-relaxed text-slate-300">{campaign.description ?? "No description provided."}</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="campaign-stat-card">
              <p className="campaign-stat-label">Goal</p>
              <p className="campaign-stat-value">{formatCurrency(toAmount(campaign.goalAmount))}</p>
            </div>
            <div className="campaign-stat-card">
              <p className="campaign-stat-label">Raised</p>
              <p className="campaign-stat-value">{formatCurrency(progress.raisedAmount)}</p>
            </div>
            <div className="campaign-stat-card">
              <p className="campaign-stat-label">Total donations</p>
              <p className="campaign-stat-value">{progress.donorCount}</p>
            </div>
            <div className="campaign-stat-card">
              <p className="campaign-stat-label">Funded</p>
              <p className="campaign-stat-value">{progress.percent}%</p>
            </div>
          </div>

          <div aria-label={`Campaign progress ${progress.percent}%`} className="h-3 rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-300 via-sky-300 to-indigo-300" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      </div>

      <div className="landing-panel p-5 md:p-6">
        <DonorBlobVisualization donations={publicDonations} />
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">Recent donations</h2>
        {campaign.donations.length === 0 ? (
          <p className="rounded-2xl border border-brand-100 bg-white p-5 text-brand-900 shadow-sm">No donations yet.</p>
        ) : (
          <ul className="space-y-3">
            {campaign.donations.map((donation) => (
              <li className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:shadow-md" key={donation.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-brand-900">
                    {getPublicDonorDisplayName({
                      isAnonymous: donation.isAnonymous,
                      donorName: donation.donorName
                    })}
                  </p>
                  <p className="text-lg font-semibold text-brand-900">{formatCurrency(toAmount(donation.amount))}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                    {donation.donationType === "RECURRING" ? "Recurring donation" : "One-time donation"}
                  </span>
                  <span className="text-brand-700">
                    {new Intl.DateTimeFormat("da-DK", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(donation.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
