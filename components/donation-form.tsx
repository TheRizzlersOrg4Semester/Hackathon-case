"use client";

import { useActionState, useRef, useState } from "react";
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
  const [paymentStepOpen, setPaymentStepOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const paymentCardholderNameRef = useRef<HTMLInputElement>(null);

  function handleContinueToPayment() {
    const form = formRef.current;

    if (!form?.reportValidity()) {
      return;
    }

    setPaymentStepOpen(true);

    window.requestAnimationFrame(() => {
      paymentCardholderNameRef.current?.focus();
    });
  }

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border border-brand-100 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        if (!paymentStepOpen) {
          event.preventDefault();
          handleContinueToPayment();
        }
      }}
      ref={formRef}
    >
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

      {!paymentStepOpen ? (
        <button
          className="w-full rounded-md bg-brand-700 px-4 py-3 font-medium text-white transition hover:bg-brand-800"
          onClick={handleContinueToPayment}
          type="button"
        >
          Continue to payment
        </button>
      ) : (
        <fieldset className="space-y-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <legend className="px-2 text-sm font-semibold text-brand-900">Payment simulation</legend>
          <p className="text-sm text-brand-800">
            Enter a valid-looking test card to finish the simulation. Full card number and CVC are validated for the
            flow, but only a masked card summary is stored with the donation.
          </p>

          <div className="grid gap-2">
            <label className="font-medium text-brand-900" htmlFor="paymentCardholderName">
              Cardholder name
            </label>
            <input
              autoComplete="cc-name"
              className="rounded-md border border-brand-100 px-3 py-2"
              id="paymentCardholderName"
              name="paymentCardholderName"
              ref={paymentCardholderNameRef}
              required={paymentStepOpen}
              type="text"
            />
          </div>

          <div className="grid gap-2">
            <label className="font-medium text-brand-900" htmlFor="paymentCardNumber">
              Card number
            </label>
            <input
              autoComplete="cc-number"
              className="rounded-md border border-brand-100 px-3 py-2"
              id="paymentCardNumber"
              inputMode="numeric"
              name="paymentCardNumber"
              pattern="[0-9 ]{12,23}"
              placeholder="4242 4242 4242 4242"
              required={paymentStepOpen}
              type="text"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="font-medium text-brand-900" htmlFor="paymentExpiryMonth">
                Expiry month
              </label>
              <input
                autoComplete="cc-exp-month"
                className="rounded-md border border-brand-100 px-3 py-2"
                id="paymentExpiryMonth"
                inputMode="numeric"
                max="12"
                min="1"
                name="paymentExpiryMonth"
                placeholder="08"
                required={paymentStepOpen}
                type="number"
              />
            </div>

            <div className="grid gap-2">
              <label className="font-medium text-brand-900" htmlFor="paymentExpiryYear">
                Expiry year
              </label>
              <input
                autoComplete="cc-exp-year"
                className="rounded-md border border-brand-100 px-3 py-2"
                id="paymentExpiryYear"
                inputMode="numeric"
                max="2100"
                min="2000"
                name="paymentExpiryYear"
                placeholder="2028"
                required={paymentStepOpen}
                type="number"
              />
            </div>

            <div className="grid gap-2">
              <label className="font-medium text-brand-900" htmlFor="paymentCvc">
                CVC
              </label>
              <input
                autoComplete="cc-csc"
                className="rounded-md border border-brand-100 px-3 py-2"
                id="paymentCvc"
                inputMode="numeric"
                maxLength={4}
                name="paymentCvc"
                pattern="[0-9]{3,4}"
                placeholder="123"
                required={paymentStepOpen}
                type="password"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="font-medium text-brand-900" htmlFor="paymentBillingPostalCode">
              Billing ZIP / postal code (optional)
            </label>
            <input
              autoComplete="postal-code"
              className="rounded-md border border-brand-100 px-3 py-2"
              id="paymentBillingPostalCode"
              name="paymentBillingPostalCode"
              type="text"
            />
          </div>

          <SubmitButton />
        </fieldset>
      )}

      {state.status === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      ) : null}

      {state.status === "success" ? (
        <div className="space-y-1 rounded-md border border-brand-100 bg-brand-50 p-3 text-sm text-brand-900">
          <p>{state.message}</p>
          <p>Receipt: {state.receiptNumber}</p>
          <p>Payment reference: {state.paymentReference}</p>
          <p>
            Payment method: {state.paymentCardBrand} ending in {state.paymentCardLast4}
          </p>
          <p>Thank-you tier: {state.thankYouTier}</p>
          <p>Thank-you email: {state.thankYouEmailMessage}</p>
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
