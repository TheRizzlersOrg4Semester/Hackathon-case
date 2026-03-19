import Link from "next/link";
import { calculateCampaignProgress } from "@/lib/domain/campaigns";
import { getPublishedCampaigns } from "@/lib/persistence/campaign-queries";

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

export default async function CampaignListPage() {
  const campaigns = await getPublishedCampaigns();

  return (
    <section className="ui-page-stack">
      <div className="ui-section-heading">
        <h1 className="type-section">Campaigns</h1>
        <p className="type-body">Support active community campaigns and follow their fundraising progress.</p>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const progress = calculateCampaignProgress(
            toAmount(campaign.goalAmount),
            campaign.donations.map((donation) => ({ amount: toAmount(donation.amount) }))
          );

          return (
            <article className="ui-campaign-card" key={campaign.id}>
              <div className="ui-campaign-card__content">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="type-card">{campaign.title}</h2>
                    <p className="type-body-sm">{campaign.category?.name ?? "Uncategorized"}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link className="ui-button-secondary" href={`/campaigns/${campaign.id}`}>
                      View details
                    </Link>
                    <Link className="ui-button-primary" href={`/donate/${campaign.id}`}>
                      Donate
                    </Link>
                  </div>
                </div>

                <p className="ui-campaign-card__summary">{campaign.summary ?? "No summary available yet."}</p>

                <div className="ui-progress-stack">
                  <div className="flex flex-wrap gap-4 text-sm text-secondary">
                    <span>Raised: {formatCurrency(progress.raisedAmount)}</span>
                    <span>Goal: {formatCurrency(progress.goalAmount)}</span>
                    <span>Donations: {progress.donorCount}</span>
                  </div>
                  <div aria-label={`Campaign progress ${progress.percent}%`} className="ui-progress-track">
                    <div className="ui-progress-fill" style={{ width: `${progress.percent}%` }} />
                  </div>
                  <p className="type-body-sm">{progress.percent}% funded</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {campaigns.length === 0 ? (
        <p className="ui-card-dark ui-panel-padding type-body">No published campaigns yet.</p>
      ) : null}
    </section>
  );
}
