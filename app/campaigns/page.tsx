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
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-brand-900">Campaigns</h1>
        <p className="text-brand-900">Support active community campaigns and follow their fundraising progress.</p>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const progress = calculateCampaignProgress(
            toAmount(campaign.goalAmount),
            campaign.donations.map((donation) => ({ amount: toAmount(donation.amount) }))
          );

          return (
            <article className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm" key={campaign.id}>
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-brand-900">{campaign.title}</h2>
                  <p className="text-sm text-brand-700">{campaign.category?.name ?? "Uncategorized"}</p>
                </div>
                <div className="flex gap-3">
                  <Link className="text-sm font-medium text-brand-700 underline" href={`/campaigns/${campaign.id}`}>
                    View details
                  </Link>
                  <Link className="text-sm font-medium text-brand-700 underline" href={`/donate/${campaign.id}`}>
                    Donate
                  </Link>
                </div>
              </div>

              <p className="mb-4 text-brand-900">{campaign.summary ?? "No summary available yet."}</p>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-4 text-sm text-brand-900">
                  <span>Raised: {formatCurrency(progress.raisedAmount)}</span>
                  <span>Goal: {formatCurrency(progress.goalAmount)}</span>
                  <span>Donations: {progress.donorCount}</span>
                </div>
                <div aria-label={`Campaign progress ${progress.percent}%`} className="h-2 rounded bg-brand-100">
                  <div className="h-full rounded bg-brand-500" style={{ width: `${progress.percent}%` }} />
                </div>
                <p className="text-sm font-medium text-brand-700">{progress.percent}% funded</p>
              </div>
            </article>
          );
        })}
      </div>

      {campaigns.length === 0 ? (
        <p className="rounded-md border border-brand-100 bg-white p-4 text-brand-900">No published campaigns yet.</p>
      ) : null}
    </section>
  );
}
