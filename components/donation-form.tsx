"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { DonationFormState } from "@/app/donate/[campaignId]/actions";

type DonationFormProps = {
  action: (state: DonationFormState, formData: FormData) => Promise<DonationFormState>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-md bg-brand-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Processing..." : "Complete simulated payment"}
    </button>
  );
}

const initialState: DonationFormState = {
  status: "idle"
};

export function DonationForm({ action }: DonationFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <div className="grid gap-2">
        <label className="font-medium text-brand-900" htmlFor="amount">
          Amount (DKK)
        </label>
        <input
          className="rounded-md border border-brand-100 px-3 py-2"
          id="amount"
          min="1"
          name="amount"
          required
          step="1"
          type="number"
        />
      </div>

      <div className="grid gap-2">
        <label className="font-medium text-brand-900" htmlFor="donationType">
          Donation type
        </label>
        <select className="rounded-md border border-brand-100 px-3 py-2" defaultValue="ONE_TIME" id="donationType" name="donationType">
          <option value="ONE_TIME">One-time</option>
          <option value="RECURRING">Recurring</option>
        </select>
      </div>

      <div className="grid gap-2">
        <label className="font-medium text-brand-900" htmlFor="donorName">
          Donor name (optional)
        </label>
        <input className="rounded-md border border-brand-100 px-3 py-2" id="donorName" name="donorName" type="text" />
      </div>

      <div className="grid gap-2">
        <label className="font-medium text-brand-900" htmlFor="donorEmail">
          Donor email (optional)
        </label>
        <input className="rounded-md border border-brand-100 px-3 py-2" id="donorEmail" name="donorEmail" type="email" />
      </div>

      <label className="flex items-center gap-2 text-brand-900" htmlFor="isAnonymous">
        <input id="isAnonymous" name="isAnonymous" type="checkbox" />
        Keep my donation anonymous in public views
      </label>

      <SubmitButton />

      {state.status === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      ) : null}

      {state.status === "success" ? (
        <div className="space-y-1 rounded-md border border-brand-100 bg-brand-50 p-3 text-sm text-brand-900">
          <p>{state.message}</p>
          <p>Receipt: {state.receiptNumber}</p>
          <p>Payment reference: {state.paymentReference}</p>
          <p>Thank-you tier: {state.thankYouTier}</p>
        </div>
      ) : null}
    </form>
  );
}
