"use client";

import Link from "next/link";
import { useActionState } from "react";
import { lookupMyDonationsAction, type MyDonationsFormState } from "@/app/my-donations/actions";

const initialState: MyDonationsFormState = {
  status: "idle"
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(amount);
}

export function MyDonationsLookup() {
  const [state, formAction, isPending] = useActionState(lookupMyDonationsAction, initialState);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-5 text-slate-100 backdrop-blur">
        <label className="grid gap-1">
          <span className="text-sm font-semibold">Supporter Access Code</span>
          <input
            className="rounded-md border border-white/30 bg-white/90 px-3 py-2 text-slate-900"
            name="supporterAccessCode"
            placeholder="PF-AB12-CD34"
            required
          />
        </label>

        <button
          className="rounded-md bg-white px-4 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Looking up..." : "Lookup my donations"}
        </button>
      </form>

      {state.message ? (
        <p className={`rounded-md p-3 text-sm ${state.status === "error" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-900"}`}>
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <section className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-5 text-slate-100 backdrop-blur">
          <p className="text-sm text-slate-200">Supporter Access Code: <span className="font-semibold text-white">{state.supporterAccessCode}</span></p>

          {state.donations && state.donations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/20 text-xs uppercase tracking-wide text-slate-300">
                  <tr>
                    <th className="px-2 py-2">Campaign</th>
                    <th className="px-2 py-2">Amount</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Visibility</th>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {state.donations.map((donation) => (
                    <tr className="border-t border-white/10" key={donation.donationId}>
                      <td className="px-2 py-2">
                        <Link className="underline" href={`/campaigns/${donation.campaignId}`}>
                          {donation.campaignTitle}
                        </Link>
                      </td>
                      <td className="px-2 py-2">{formatCurrency(donation.amount)}</td>
                      <td className="px-2 py-2">{donation.donationType === "RECURRING" ? "Recurring" : "One-time"}</td>
                      <td className="px-2 py-2">{donation.isAnonymous ? "Anonymous" : "Named"}</td>
                      <td className="px-2 py-2">
                        {new Intl.DateTimeFormat("da-DK", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        }).format(new Date(donation.createdAt))}
                      </td>
                      <td className="px-2 py-2">{donation.receiptNumber ?? "No receipt"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
