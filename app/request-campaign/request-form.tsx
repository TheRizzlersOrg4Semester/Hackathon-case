"use client";

import { useActionState } from "react";
import { submitCampaignRequestAction, type CampaignRequestFormState } from "@/app/request-campaign/actions";

const initialState: CampaignRequestFormState = {
  status: "idle"
};

export function CampaignRequestForm() {
  const [state, formAction, isPending] = useActionState(submitCampaignRequestAction, initialState);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-white/20 bg-white/90 p-6 shadow-lg backdrop-blur">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-900">
          Requester name
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" name="requesterName" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-900">
          Requester email
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" name="requesterEmail" required type="email" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-900">
          Campaign title
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" name="title" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-900">
          Category
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" name="category" placeholder="Education, Health, Environment..." required />
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium text-slate-900">
        One-line summary
        <input className="w-full rounded-lg border border-slate-300 px-3 py-2" name="summary" required />
      </label>

      <label className="block space-y-1 text-sm font-medium text-slate-900">
        Full description
        <textarea className="min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2" name="description" required />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-900">
          Goal amount (DKK)
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" min={1} name="goalAmount" required step="1" type="number" />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-900">
          Motivation
          <textarea className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2" name="motivation" required />
        </label>
      </div>

      {state.message ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"}`}>
          {state.message}
        </p>
      ) : null}

      <button
        className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Submitting request..." : "Submit campaign request"}
      </button>
    </form>
  );
}
