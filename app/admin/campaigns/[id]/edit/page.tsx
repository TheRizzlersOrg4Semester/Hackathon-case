import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminMilestoneFields } from "@/components/admin-milestone-fields";
import { AnalyticsKpiCard } from "@/components/analytics-kpi-card";
import { AnalyticsSplitCard } from "@/components/analytics-split-card";
import { AnalyticsTimeSeriesChart } from "@/components/analytics-time-series-chart";
import {
  closeCampaignAction,
  deleteDonationAction,
  publishCampaignAction,
  updateCampaignAction
} from "@/app/admin/actions";
import { getAdminCampaignById, getAdminCategories } from "@/lib/persistence/admin-queries";
import { getCampaignAnalytics } from "@/lib/services/analytics";

type AdminEditCampaignPageProps = {
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

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getRecentActivityLabel(donorName: string | null, isAnonymous: boolean): string {
  if (isAnonymous) {
    return "Anonymous donor";
  }

  return donorName?.trim() ? donorName : "Guest donor";
}

export default async function AdminEditCampaignPage({ params }: AdminEditCampaignPageProps) {
  const { id } = await params;
  const [campaign, categories, analytics] = await Promise.all([getAdminCampaignById(id), getAdminCategories(), getCampaignAnalytics(id)]);

  if (!campaign) {
    notFound();
  }

  const campaignAnalytics = analytics ?? {
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    campaignStatus: campaign.status,
    goalAmount: toAmount(campaign.goalAmount),
    totalRaised: 0,
    donationCount: 0,
    averageDonation: 0,
    progressPercent: 0,
    donationTypeDistribution: {
      oneTime: { count: 0, totalAmount: 0, sharePercent: 0 },
      recurring: { count: 0, totalAmount: 0, sharePercent: 0 }
    },
    anonymitySplit: {
      anonymousCount: 0,
      namedCount: 0,
      anonymousSharePercent: 0,
      namedSharePercent: 0
    },
    dailySeries: []
  };

  const recentActivity = campaign.donations.slice(0, 5);
  const updateSubscriberCount = campaign.donations.filter((donation) => donation.subscribedToUpdates).length;
  const updateAction = updateCampaignAction.bind(null, campaign.id);
  const publishAction = publishCampaignAction.bind(null, campaign.id);
  const closeAction = closeCampaignAction.bind(null, campaign.id);

  return (
    <section className="space-y-8">
      <div className="analytics-hero px-6 py-7 md:px-8 md:py-8">
        <div className="analytics-hero-glow" />
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/85">Campaign analytics</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">{campaign.title}</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                A premium, demo-ready analytics surface for understanding fundraising performance, donation behavior, and the latest campaign activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="analytics-chip">{campaign.status}</span>
              <span className="analytics-chip">{campaign.category?.name ?? "Uncategorized"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 backdrop-blur" href="/admin/campaigns">
              Back to list
            </Link>
            <span className="text-sm text-slate-300">Campaign ID: {campaign.id}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsKpiCard
          detail={`${formatCurrency(campaignAnalytics.goalAmount)} goal`}
          label="Raised amount"
          tone="teal"
          value={formatCurrency(campaignAnalytics.totalRaised)}
        />
        <AnalyticsKpiCard detail="Donation events recorded" label="Donation count" tone="sky" value={String(campaignAnalytics.donationCount)} />
        <AnalyticsKpiCard detail="Average gift size" label="Average donation" tone="slate" value={formatCurrency(campaignAnalytics.averageDonation)} />
        <AnalyticsKpiCard detail="Progress toward target" label="Funded percent" tone="sky" value={formatPercent(campaignAnalytics.progressPercent)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="analytics-panel p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">Donation activity</h2>
              <p className="mt-1 text-sm text-slate-300">Daily donation flow with a cumulative line so campaign momentum reads at a glance.</p>
            </div>
            <span className="analytics-chip">{campaignAnalytics.dailySeries.length} tracked days</span>
          </div>
          <AnalyticsTimeSeriesChart goalAmount={campaignAnalytics.goalAmount} series={campaignAnalytics.dailySeries} variant="campaign" />
        </div>

        <div className="space-y-5">
          <AnalyticsSplitCard
            description="A simple read on how supporters split between one-off and recurring giving."
            items={[
              {
                label: "One-time",
                value: `${campaignAnalytics.donationTypeDistribution.oneTime.count}`,
                hint: `${formatCurrency(campaignAnalytics.donationTypeDistribution.oneTime.totalAmount)} raised`,
                percent: campaignAnalytics.donationTypeDistribution.oneTime.sharePercent,
                tone: "teal"
              },
              {
                label: "Recurring",
                value: `${campaignAnalytics.donationTypeDistribution.recurring.count}`,
                hint: `${formatCurrency(campaignAnalytics.donationTypeDistribution.recurring.totalAmount)} raised`,
                percent: campaignAnalytics.donationTypeDistribution.recurring.sharePercent,
                tone: "sky"
              }
            ]}
            title="Donation type split"
          />

          <AnalyticsSplitCard
            description="Privacy-aware counts that stay aligned with the existing public anonymity behavior."
            items={[
              {
                label: "Anonymous",
                value: `${campaignAnalytics.anonymitySplit.anonymousCount}`,
                hint: "Hidden identity in public views",
                percent: campaignAnalytics.anonymitySplit.anonymousSharePercent,
                tone: "slate"
              },
              {
                label: "Public",
                value: `${campaignAnalytics.anonymitySplit.namedCount}`,
                hint: "Named or guest donations",
                percent: campaignAnalytics.anonymitySplit.namedSharePercent,
                tone: "teal"
              }
            ]}
            title="Anonymous vs public split"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="analytics-panel p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-300">A clean list of the latest donation events for this campaign.</p>
            </div>
            <span className="analytics-chip">{recentActivity.length} latest entries</span>
          </div>

          {recentActivity.length === 0 ? (
            <p className="mt-6 rounded-[1.4rem] border border-dashed border-white/12 bg-white/[0.04] p-5 text-sm text-slate-300">
              No donation activity yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {recentActivity.map((donation) => (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3" key={donation.id}>
                  <div>
                    <p className="font-semibold text-slate-50">{getRecentActivityLabel(donation.donorName, donation.isAnonymous)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {donation.donationType === "RECURRING" ? "Recurring donation" : "One-time donation"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-100">{formatCurrency(toAmount(donation.amount))}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {new Intl.DateTimeFormat("da-DK", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(donation.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form action={updateAction} className="analytics-panel space-y-4 p-5 md:p-6 text-slate-100">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">Campaign settings</h2>
            <p className="mt-1 text-sm text-slate-300">Analytics stays front and center, while edit controls remain close by for demo flexibility.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Title
              <input
                className="w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
                defaultValue={campaign.title}
                name="title"
                required
              />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Slug
              <input
                className="w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
                defaultValue={campaign.slug}
                name="slug"
                required
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm font-medium">
            Category
            <select className="w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900" defaultValue={campaign.category?.id ?? ""} name="categoryId">
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium">
            Summary
            <input
              className="w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
              defaultValue={campaign.summary ?? ""}
              name="summary"
              required
            />
          </label>

          <label className="block space-y-1 text-sm font-medium">
            Description
            <textarea
              className="min-h-32 w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
              defaultValue={campaign.description ?? ""}
              name="description"
              required
            />
          </label>

          <label className="block space-y-1 text-sm font-medium">
            Campaign image/logo URL (optional)
            <input
              className="w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
              defaultValue={campaign.brandImageUrl ?? ""}
              name="brandImageUrl"
              type="url"
            />
          </label>

          <label className="block space-y-1 text-sm font-medium">
            Goal amount (DKK)
            <input
              className="w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
              defaultValue={toAmount(campaign.goalAmount)}
              min={1}
              name="goalAmount"
              required
              step="1"
              type="number"
            />
          </label>

          <AdminMilestoneFields
            milestones={campaign.milestones.map((milestone) => ({
              id: milestone.id,
              title: milestone.title,
              description: milestone.description,
              targetAmount: toAmount(milestone.targetAmount),
              displayOrder: milestone.displayOrder
            }))}
          />

          <button className="rounded-full bg-white px-5 py-2.5 font-semibold text-slate-900" type="submit">
            Save campaign changes
          </button>
        </form>
      </div>

      <div className="analytics-panel p-6 text-slate-100">
        <h2 className="text-xl font-semibold">Lifecycle controls</h2>
        <p className="mt-1 text-sm text-slate-200">Current status: {campaign.status}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <form action={publishAction}>
            <button
              className="rounded-full bg-emerald-300 px-5 py-2.5 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={campaign.status !== "DRAFT"}
              type="submit"
            >
              Publish campaign
            </button>
          </form>

          <form action={closeAction}>
            <button
              className="rounded-full bg-rose-300 px-5 py-2.5 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={campaign.status !== "PUBLISHED"}
              type="submit"
            >
              Close campaign
            </button>
          </form>
        </div>
      </div>

      <div className="analytics-panel space-y-3 p-6 text-slate-100">
        <h2 className="text-xl font-semibold">Donations ({campaign.donations.length})</h2>
        <p className="text-sm text-slate-200">
          Delete remains intentionally simple for demo reset and testing workflows. Update signups captured: {updateSubscriberCount}.
        </p>

        {campaign.donations.length === 0 ? (
          <p className="text-sm text-slate-300">No donations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-2 py-2">Donor</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Updates</th>
                  <th className="px-2 py-2">Tier</th>
                  <th className="px-2 py-2">Mail</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaign.donations.map((donation) => {
                  const removeAction = deleteDonationAction.bind(null, campaign.id, donation.id);

                  return (
                    <tr className="border-t border-white/10" key={donation.id}>
                      <td className="px-2 py-2">{donation.isAnonymous ? "Anonymous" : donation.donorName ?? "Guest donor"}</td>
                      <td className="px-2 py-2">{donation.donorEmail ?? "-"}</td>
                      <td className="px-2 py-2">{formatCurrency(toAmount(donation.amount))}</td>
                      <td className="px-2 py-2">{donation.donationType}</td>
                      <td className="px-2 py-2">{donation.subscribedToUpdates ? "Opted in" : "-"}</td>
                      <td className="px-2 py-2">{donation.thankYouAction?.tier ?? "-"}</td>
                      <td className="px-2 py-2">{donation.thankYouAction?.emailStatus ?? "PENDING"}</td>
                      <td className="px-2 py-2">
                        {new Intl.DateTimeFormat("da-DK", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        }).format(donation.createdAt)}
                      </td>
                      <td className="px-2 py-2">
                        <form action={removeAction}>
                          <button className="rounded border border-rose-200 px-2 py-1 text-rose-100 hover:bg-rose-500/20" type="submit">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
