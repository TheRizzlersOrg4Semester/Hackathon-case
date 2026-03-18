import Link from "next/link";
import { createCampaignAction } from "@/app/admin/actions";
import { getAdminCategories } from "@/lib/persistence/admin-queries";

export default async function AdminNewCampaignPage() {
  const categories = await getAdminCategories();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-100">Create campaign</h1>
        <p className="text-slate-200">New campaigns start as DRAFT and can be published when ready.</p>
      </div>

      <form action={createCampaignAction} className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100 backdrop-blur">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            Title
            <input className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900" name="title" required />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Slug
            <input className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900" name="slug" required />
          </label>
        </div>

        <label className="block space-y-1 text-sm font-medium">
          Category
          <select className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900" defaultValue="" name="categoryId">
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
          <input className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900" name="summary" required />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          Description
          <textarea className="min-h-32 w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900" name="description" required />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          Goal amount (DKK)
          <input className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-slate-900" min={1} name="goalAmount" required step="1" type="number" />
        </label>

        <div className="flex gap-3">
          <button className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-900" type="submit">
            Create draft campaign
          </button>
          <Link className="rounded-lg border border-white/40 px-4 py-2" href="/admin/campaigns">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
