import Link from "next/link";
import { notFound } from "next/navigation";
import {
  closeCampaignAction,
  deleteDonationAction,
  publishCampaignAction,
  updateCampaignAction
} from "@/app/admin/actions";
import { getAdminCampaignById, getAdminCategories } from "@/lib/persistence/admin-queries";

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

export default async function AdminEditCampaignPage({ params }: AdminEditCampaignPageProps) {
  const { id } = await params;
  const [campaign, categories] = await Promise.all([getAdminCampaignById(id), getAdminCategories()]);

  if (!campaign) {
    notFound();
  }

  const updateAction = updateCampaignAction.bind(null, campaign.id);
  const publishAction = publishCampaignAction.bind(null, campaign.id);
  const closeAction = closeCampaignAction.bind(null, campaign.id);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-100">Edit campaign</h1>
          <p className="text-slate-200">Campaign ID: {campaign.id}</p>
        </div>
        <Link className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-slate-100" href="/admin/campaigns">
          Back to list
        </Link>
      </div>

      <form action={updateAction} className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100 backdrop-blur">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            Title
            <input
              className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900"
              defaultValue={campaign.title}
              name="title"
              required
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Slug
            <input
              className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900"
              defaultValue={campaign.slug}
              name="slug"
              required
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm font-medium">
          Category
          <select
            className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900"
            defaultValue={campaign.category?.id ?? ""}
            name="categoryId"
          >
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
            className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900"
            defaultValue={campaign.summary ?? ""}
            name="summary"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          Description
          <textarea
            className="min-h-32 w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900"
            defaultValue={campaign.description ?? ""}
            name="description"
            required
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          Goal amount (DKK)
          <input
            className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900"
            defaultValue={toAmount(campaign.goalAmount)}
            min={1}
            name="goalAmount"
            required
            step="1"
            type="number"
          />
        </label>

        <button className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-900" type="submit">
          Save campaign changes
        </button>
      </form>

      <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100 backdrop-blur">
        <h2 className="text-xl font-semibold">Lifecycle controls</h2>
        <p className="mt-1 text-sm text-slate-200">Current status: {campaign.status}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <form action={publishAction}>
            <button
              className="rounded-lg bg-emerald-300 px-4 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={campaign.status !== "DRAFT"}
              type="submit"
            >
              Publish campaign
            </button>
          </form>

          <form action={closeAction}>
            <button
              className="rounded-lg bg-rose-300 px-4 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={campaign.status !== "PUBLISHED"}
              type="submit"
            >
              Close campaign
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100 backdrop-blur">
        <h2 className="text-xl font-semibold">Donations ({campaign.donations.length})</h2>
        <p className="text-sm text-slate-200">Delete is intentionally simple for demo reset/testing workflows.</p>

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
