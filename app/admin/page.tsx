import Link from "next/link";
import { getAdminOverviewData } from "@/lib/persistence/admin-queries";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverviewData();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-100">Admin overview</h1>
        <p className="text-slate-200">Demo utilities for managing campaigns, campaign requests, and donation cleanup.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-white/20 bg-white/10 p-4 text-slate-100 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-300">Draft campaigns</p>
          <p className="mt-2 text-3xl font-semibold">{overview.campaignCounts.DRAFT}</p>
        </article>
        <article className="rounded-xl border border-white/20 bg-white/10 p-4 text-slate-100 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-300">Published campaigns</p>
          <p className="mt-2 text-3xl font-semibold">{overview.campaignCounts.PUBLISHED}</p>
        </article>
        <article className="rounded-xl border border-white/20 bg-white/10 p-4 text-slate-100 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-300">Closed campaigns</p>
          <p className="mt-2 text-3xl font-semibold">{overview.campaignCounts.CLOSED}</p>
        </article>
        <article className="rounded-xl border border-white/20 bg-white/10 p-4 text-slate-100 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-300">Pending campaign requests</p>
          <p className="mt-2 text-3xl font-semibold">{overview.pendingRequestCount}</p>
        </article>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-900" href="/admin/campaigns">
          Manage campaigns
        </Link>
        <Link className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 font-semibold text-slate-100" href="/admin/campaign-requests">
          Review campaign requests
        </Link>
      </div>

      <p className="text-sm text-slate-300">Total donations in database: {overview.totalDonationCount}</p>
    </section>
  );
}
