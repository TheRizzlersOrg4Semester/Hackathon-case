import Link from "next/link";
import { AnalyticsKpiCard } from "@/components/analytics-kpi-card";
import { AnalyticsSplitCard } from "@/components/analytics-split-card";
import { AnalyticsTimeSeriesChart } from "@/components/analytics-time-series-chart";
import { getPlatformAnalyticsSummary } from "@/lib/services/analytics";
import { getAnnualTaxReport } from "@/lib/services/tax-reporting";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function AdminOverviewPage() {
  const [overview, taxReport] = await Promise.all([getPlatformAnalyticsSummary(), getAnnualTaxReport()]);

  return (
    <section className="space-y-8">
      <div className="analytics-hero px-6 py-7 md:px-8 md:py-8">
        <div className="analytics-hero-glow" />
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/85">Platform analytics</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">A premium fundraising overview for the whole PulseFund platform.</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                Track donation momentum, campaign health, and request load in one calm dashboard that is polished enough for demos and readable enough for real review.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="analytics-chip">{overview.totalCampaigns} total campaigns</span>
              <span className="analytics-chip">{formatCurrency(overview.averageDonation)} average donation</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg" href="/admin/campaigns">
              Manage campaigns
            </Link>
            <Link className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 backdrop-blur" href="/admin/campaign-requests">
              Review requests
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AnalyticsKpiCard detail="Across all fundraising activity" label="Total raised" tone="teal" value={formatCurrency(overview.totalRaised)} />
        <AnalyticsKpiCard detail="Donation events in the platform" label="Total donations" tone="sky" value={String(overview.totalDonations)} />
        <AnalyticsKpiCard detail="Currently published campaigns" label="Active campaigns" tone="slate" value={String(overview.campaignCounts.PUBLISHED)} />
        <AnalyticsKpiCard detail="Campaigns that have been closed" label="Closed campaigns" tone="slate" value={String(overview.campaignCounts.CLOSED)} />
        <AnalyticsKpiCard detail="Awaiting admin decision" label="Pending requests" tone="sky" value={String(overview.pendingRequestCount)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="analytics-panel p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">Platform fundraising trend</h2>
              <p className="mt-1 text-sm text-slate-300">Daily donation totals with a restrained cumulative line so the fundraising story reads clearly in demos.</p>
            </div>
            <span className="analytics-chip">Live from donation records</span>
          </div>
          <AnalyticsTimeSeriesChart series={overview.dailySeries} variant="platform" />
        </div>

        <div className="space-y-5">
          <AnalyticsSplitCard
            description="A quick read on how supporters prefer to contribute across the platform."
            items={[
              {
                label: "One-time",
                value: `${overview.donationTypeDistribution.oneTime.count}`,
                hint: `${formatCurrency(overview.donationTypeDistribution.oneTime.totalAmount)} raised`,
                percent: overview.donationTypeDistribution.oneTime.sharePercent,
                tone: "teal"
              },
              {
                label: "Recurring",
                value: `${overview.donationTypeDistribution.recurring.count}`,
                hint: `${formatCurrency(overview.donationTypeDistribution.recurring.totalAmount)} raised`,
                percent: overview.donationTypeDistribution.recurring.sharePercent,
                tone: "sky"
              }
            ]}
            title="Donation type split"
          />

          <AnalyticsSplitCard
            description="A privacy-aware split that stays aligned with the existing donor anonymity rules."
            items={[
              {
                label: "Anonymous",
                value: `${overview.anonymitySplit.anonymousCount}`,
                hint: "Private in public views",
                percent: overview.anonymitySplit.anonymousSharePercent,
                tone: "slate"
              },
              {
                label: "Public",
                value: `${overview.anonymitySplit.namedCount}`,
                hint: "Named or guest donations",
                percent: overview.anonymitySplit.namedSharePercent,
                tone: "teal"
              }
            ]}
            title="Anonymous vs public split"
          />
        </div>
      </div>

      <div className="analytics-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">Top campaigns</h2>
            <p className="mt-1 text-sm text-slate-300">Highest-performing campaigns by raised amount, with quick links into their analytics view.</p>
          </div>
          <Link className="text-sm font-semibold text-cyan-200 underline-offset-4 hover:underline" href="/admin/campaigns">
            View all campaigns
          </Link>
        </div>

        {overview.topCampaigns.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-300">No campaign fundraising activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-100">
              <thead className="bg-black/15 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-6 py-3">Campaign</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Raised</th>
                  <th className="px-6 py-3">Goal</th>
                  <th className="px-6 py-3">Donations</th>
                  <th className="px-6 py-3">Funded</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {overview.topCampaigns.map((campaign) => (
                  <tr className="border-t border-white/8" key={campaign.id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-50">{campaign.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                        Updated{" "}
                        {new Intl.DateTimeFormat("da-DK", {
                          dateStyle: "medium"
                        }).format(campaign.updatedAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{campaign.status}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-100">{formatCurrency(campaign.totalRaised)}</td>
                    <td className="px-6 py-4 text-slate-300">{formatCurrency(campaign.goalAmount)}</td>
                    <td className="px-6 py-4 text-slate-300">{campaign.donationCount}</td>
                    <td className="px-6 py-4 text-slate-300">{campaign.progressPercent.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <Link className="text-cyan-200 underline-offset-4 hover:underline" href={`/admin/campaigns/${campaign.id}/edit`}>
                        Open analytics
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="analytics-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">Tax deduction support ({taxReport.year})</h2>
            <p className="mt-1 text-sm text-slate-300">Simple admin aggregation of tax-eligible donations grouped by tax ID for MVP reporting workflows.</p>
          </div>
          <span className="analytics-chip">{formatCurrency(taxReport.totalEligibleAmount)} eligible total</span>
        </div>

        {taxReport.entries.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-300">No tax-eligible donations recorded for {taxReport.year}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-100">
              <thead className="bg-black/15 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-6 py-3">Tax ID</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Donations</th>
                  <th className="px-6 py-3">Total donated</th>
                </tr>
              </thead>
              <tbody>
                {taxReport.entries.map((entry) => (
                  <tr className="border-t border-white/8" key={`${entry.taxIdType}-${entry.taxId}`}>
                    <td className="px-6 py-4 font-medium text-slate-50">{entry.taxId}</td>
                    <td className="px-6 py-4 text-slate-300">{entry.taxIdType}</td>
                    <td className="px-6 py-4 text-slate-300">{entry.donationCount}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-100">{formatCurrency(entry.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
