import Link from "next/link";
import { getAdminCampaigns } from "@/lib/persistence/admin-queries";

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

export default async function AdminCampaignListPage() {
  const campaigns = await getAdminCampaigns();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-100">Campaign management</h1>
          <p className="text-slate-200">Create, edit, publish, close, and clean up campaign donations.</p>
        </div>
        <Link className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-900" href="/admin/campaigns/new">
          Create campaign
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
        <table className="min-w-full text-left text-sm text-slate-100">
          <thead className="bg-black/20 text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Raised</th>
              <th className="px-4 py-3">Donations</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const raised = campaign.donations.reduce((sum, donation) => sum + toAmount(donation.amount), 0);

              return (
                <tr className="border-t border-white/10" key={campaign.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{campaign.title}</p>
                    <p className="text-xs text-slate-300">
                      {campaign.category?.name ?? "Uncategorized"} - /campaigns/{campaign.id}
                    </p>
                  </td>
                  <td className="px-4 py-3">{campaign.status}</td>
                  <td className="px-4 py-3">{formatCurrency(toAmount(campaign.goalAmount))}</td>
                  <td className="px-4 py-3">{formatCurrency(raised)}</td>
                  <td className="px-4 py-3">{campaign._count.donations}</td>
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/admin/campaigns/${campaign.id}/edit`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {campaigns.length === 0 ? <p className="text-slate-200">No campaigns yet.</p> : null}
    </section>
  );
}
