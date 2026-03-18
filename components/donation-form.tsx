"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { buildBlobSwatchBackground, DONATION_BLOB_COLOR_OPTIONS } from "@/lib/domain/blob-colors";
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
  const [accessCodeMode, setAccessCodeMode] = useState<"CREATE_NEW" | "USE_EXISTING">("CREATE_NEW");
  const [selectedBlobColor, setSelectedBlobColor] = useState<string>(DONATION_BLOB_COLOR_OPTIONS[0].value);

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
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

      <fieldset className="space-y-2 rounded-md border border-brand-100 p-3">
        <legend className="px-1 text-sm font-semibold text-brand-900">Supporter Access Code</legend>

        <label className="flex items-center gap-2 text-sm text-brand-900" htmlFor="access-mode-new">
          <input
            checked={accessCodeMode === "CREATE_NEW"}
            id="access-mode-new"
            name="accessCodeMode"
            onChange={() => setAccessCodeMode("CREATE_NEW")}
            type="radio"
            value="CREATE_NEW"
          />
          First time donating - generate my code
        </label>

        <label className="flex items-center gap-2 text-sm text-brand-900" htmlFor="access-mode-existing">
          <input
            checked={accessCodeMode === "USE_EXISTING"}
            id="access-mode-existing"
            name="accessCodeMode"
            onChange={() => setAccessCodeMode("USE_EXISTING")}
            type="radio"
            value="USE_EXISTING"
          />
          I already have a Supporter Access Code
        </label>

        {accessCodeMode === "USE_EXISTING" ? (
          <div className="grid gap-1">
            <label className="text-sm font-medium text-brand-900" htmlFor="supporterAccessCode">
              Existing Supporter Access Code
            </label>
            <input
              className="rounded-md border border-brand-100 px-3 py-2"
              id="supporterAccessCode"
              name="supporterAccessCode"
              placeholder="PF-AB12-CD34"
              required
            />
          </div>
        ) : null}
      </fieldset>

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

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-brand-900">Blob color</legend>
        <input name="blobColor" type="hidden" value={selectedBlobColor} />
        <div className="grid grid-cols-8 gap-2 rounded-md border border-brand-100 bg-slate-900 p-3">
          {DONATION_BLOB_COLOR_OPTIONS.map((option) => {
            const selected = option.value === selectedBlobColor;

            return (
              <button
                className={`relative h-8 w-8 rounded-full border transition ${
                  selected
                    ? "border-white ring-2 ring-cyan-200/80 ring-offset-2 ring-offset-slate-900"
                    : "border-white/20 hover:border-white/50"
                }`}
                key={option.value}
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedBlobColor(option.value);
                }}
                style={{ background: buildBlobSwatchBackground(option.value) }}
                title={option.label}
                type="button"
              >
                <span className="sr-only">{option.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

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
          <p className="font-semibold">Supporter Access Code: {state.supporterAccessCode}</p>
          <p>
            {state.supporterAccessCodeCreated
              ? "New code created. Use it on My Donations to view your receipts later."
              : "Code reused. You can view the full donation history on My Donations."}
          </p>
        </div>
      ) : null}
    </form>
  );
}
