import Link from "next/link";
import { reviewCampaignRequestAction } from "@/app/admin/actions";
import { getAdminCampaignRequests } from "@/lib/persistence/admin-queries";

export const dynamic = "force-dynamic";

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

export default async function AdminCampaignRequestPage() {
  const requests = await getAdminCampaignRequests();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-100">Campaign requests</h1>
          <p className="text-slate-200">Approve to convert a request into a draft campaign, or reject it.</p>
        </div>
        <Link className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-slate-100" href="/admin">
          Back to admin overview
        </Link>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <article className="rounded-2xl border border-white/20 bg-white/10 p-5 text-slate-100 backdrop-blur" key={request.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{request.title}</h2>
                <p className="text-sm text-slate-200">
                  {request.requesterName} ({request.requesterEmail}) - {request.category}
                </p>
              </div>
              <p
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  request.status === "PENDING"
                    ? "bg-amber-200 text-amber-900"
                    : request.status === "APPROVED"
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-rose-200 text-rose-900"
                }`}
              >
                {request.status}
              </p>
            </div>

            <p className="mt-3 text-sm text-slate-200">{request.summary}</p>
            <p className="mt-2 text-sm text-slate-300">{request.description}</p>
            <p className="mt-3 text-sm text-slate-200">Goal: {formatCurrency(toAmount(request.goalAmount))}</p>
            <p className="mt-1 text-sm text-slate-300">Motivation: {request.motivation}</p>

            <p className="mt-3 text-xs text-slate-300">
              Submitted {new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" }).format(request.createdAt)}
            </p>

            {request.status === "PENDING" ? (
              <div className="mt-4 flex gap-3">
                <form action={reviewCampaignRequestAction}>
                  <input name="requestId" type="hidden" value={request.id} />
                  <input name="decision" type="hidden" value="APPROVED" />
                  <button className="rounded-lg bg-emerald-300 px-4 py-2 font-semibold text-slate-900" type="submit">
                    Approve
                  </button>
                </form>

                <form action={reviewCampaignRequestAction}>
                  <input name="requestId" type="hidden" value={request.id} />
                  <input name="decision" type="hidden" value="REJECTED" />
                  <button className="rounded-lg bg-rose-300 px-4 py-2 font-semibold text-slate-900" type="submit">
                    Reject
                  </button>
                </form>
              </div>
            ) : null}

            {request.status === "APPROVED" && request.approvedCampaign ? (
              <p className="mt-4 text-sm text-slate-200">
                Approved into campaign: <Link className="underline" href={`/admin/campaigns/${request.approvedCampaign.id}/edit`}>{request.approvedCampaign.title}</Link>
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {requests.length === 0 ? <p className="text-slate-200">No campaign requests yet.</p> : null}
    </section>
  );
}
