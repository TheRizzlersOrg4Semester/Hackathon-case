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
    <section className="ui-page-stack">
      <div className="campaign-detail-hero relative overflow-hidden rounded-[2rem] border border-white/20 px-6 py-8 md:px-8 md:py-10">
        <div className="campaign-detail-hero-glow" />
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link className="ui-button-secondary type-meta" href="/campaigns">
              Back to campaigns
            </Link>
            <Link className="ui-button-primary" href={`/donate/${campaign.id}`}>
              Make a donation
            </Link>
          </div>

          <div className="space-y-3">
            <p className="ui-card-badge">
              {campaign.category?.name ?? "Uncategorized"}
            </p>
            <h1 className="type-hero max-w-4xl text-white">{campaign.title}</h1>
            <p className="type-body max-w-3xl text-secondary">{campaign.summary ?? "No summary provided."}</p>
          </div>

          <p className="type-body-sm max-w-4xl text-muted">{campaign.description ?? "No description provided."}</p>

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

          <div aria-label={`Campaign progress ${progress.percent}%`} className="ui-progress-track h-3">
            <div className="ui-progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      </div>

      <div className="landing-panel p-5 md:p-6">
        <DonorBlobVisualization donations={publicDonations} />
      </div>

      <div className="ui-section-stack">
        <h2 className="type-section text-primary">Recent donations</h2>
        {campaign.donations.length === 0 ? (
          <p className="ui-card-dark ui-panel-padding type-body">No donations yet.</p>
        ) : (
          <ul className="space-y-3">
            {campaign.donations.map((donation) => (
              <li className="ui-card-dark ui-panel-padding transition hover:shadow-md" key={donation.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="type-card text-primary">
                    {getPublicDonorDisplayName({
                      isAnonymous: donation.isAnonymous,
                      donorName: donation.donorName
                    })}
                  </p>
                  <p className="type-card text-primary">{formatCurrency(toAmount(donation.amount))}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="ui-card-badge">
                    {donation.donationType === "RECURRING" ? "Recurring donation" : "One-time donation"}
                  </span>
                  <span className="type-body-sm text-secondary">
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
