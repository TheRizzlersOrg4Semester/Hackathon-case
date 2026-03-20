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
    <button className="ui-button-primary" disabled={pending} type="submit">
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
  const [useTaxDeduction, setUseTaxDeduction] = useState(false);
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
      className="ui-form-panel space-y-6"
      onSubmit={(event) => {
        if (!paymentStepOpen) {
          event.preventDefault();
          handleContinueToPayment();
        }
      }}
      ref={formRef}
    >
      <div className="grid gap-2">
        <label className="ui-form-label" htmlFor="amount">
          Amount (DKK)
        </label>
        <input className="ui-form-input" id="amount" min="1" name="amount" required step="1" type="number" />
      </div>

      <div className="grid gap-2">
        <label className="ui-form-label" htmlFor="donationType">
          Donation type
        </label>
        <select className="ui-form-select" defaultValue="ONE_TIME" id="donationType" name="donationType">
          <option value="ONE_TIME">One-time</option>
          <option value="RECURRING">Recurring</option>
        </select>
      </div>

      <fieldset className="ui-form-fieldset">
        <legend className="ui-form-legend">Supporter Access Code</legend>

        <label className="type-body-sm flex items-center gap-2 text-secondary" htmlFor="access-mode-new">
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

        <label className="type-body-sm flex items-center gap-2 text-secondary" htmlFor="access-mode-existing">
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
            <label className="ui-form-label" htmlFor="supporterAccessCode">
              Existing Supporter Access Code
            </label>
            <input
              className="ui-form-input"
              id="supporterAccessCode"
              name="supporterAccessCode"
              placeholder="PF-AB12-CD34"
              required
            />
          </div>
        ) : null}
      </fieldset>

      <div className="grid gap-2">
        <label className="ui-form-label" htmlFor="donorName">
          Donor name (optional)
        </label>
        <input className="ui-form-input" id="donorName" name="donorName" type="text" />
      </div>

      <div className="grid gap-2">
        <label className="ui-form-label" htmlFor="donorEmail">
          Donor email (optional)
        </label>
        <input className="ui-form-input" id="donorEmail" name="donorEmail" type="email" />
      </div>

      <fieldset className="ui-form-fieldset">
        <legend className="ui-form-legend">Tax deduction (MVP)</legend>

        <label className="type-body-sm flex items-center gap-2 text-secondary" htmlFor="taxEligible">
          <input
            checked={useTaxDeduction}
            id="taxEligible"
            name="taxEligible"
            onChange={(event) => setUseTaxDeduction(event.target.checked)}
            type="checkbox"
          />
          Use for tax deduction
        </label>

        {useTaxDeduction ? (
          <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
            <label className="ui-form-label grid gap-1">
              Tax ID type
              <select className="ui-form-select" defaultValue="CPR" name="taxIdType">
                <option value="CPR">CPR</option>
                <option value="CVR">CVR</option>
              </select>
            </label>

            <label className="ui-form-label grid gap-1">
              Tax ID
              <input className="ui-form-input" name="taxId" placeholder="Enter CPR or CVR" required />
            </label>
          </div>
        ) : null}

        <p className="type-meta text-muted">Demo only. PulseFund stores the identifier for later admin aggregation and does not send it to SKAT.</p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="ui-form-legend">Blob color</legend>
        <input name="blobColor" type="hidden" value={selectedBlobColor} />
        <div className="ui-card-dark grid grid-cols-8 gap-2 p-3">
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

      <label className="type-body-sm flex items-center gap-2 text-secondary" htmlFor="isAnonymous">
        <input id="isAnonymous" name="isAnonymous" type="checkbox" />
        Keep my donation anonymous in public views
      </label>

      <div className="ui-card-soft ui-panel-padding space-y-2">
        <label className="type-body-sm flex items-center gap-2 text-secondary" htmlFor="subscribedToUpdates">
          <input id="subscribedToUpdates" name="subscribedToUpdates" type="checkbox" />
          Send me campaign updates about milestones and progress
        </label>
        <p className="type-meta text-muted">Optional simulated signup only. No real email subscription is triggered in this MVP.</p>
      </div>

      {!paymentStepOpen ? (
        <button className="ui-button-secondary w-full justify-center" onClick={handleContinueToPayment} type="button">
          Continue to payment
        </button>
      ) : (
        <fieldset className="ui-card-soft ui-panel-padding space-y-4">
          <legend className="ui-form-legend">Payment simulation</legend>
          <p className="type-body-sm text-secondary">
            Enter a valid-looking test card to finish the simulation. Full card number and CVC are validated for the
            flow, but only a masked card summary is stored with the donation.
          </p>

          <div className="grid gap-2">
            <label className="ui-form-label" htmlFor="paymentCardholderName">
              Cardholder name
            </label>
            <input
              autoComplete="cc-name"
              className="ui-form-input"
              id="paymentCardholderName"
              name="paymentCardholderName"
              ref={paymentCardholderNameRef}
              required={paymentStepOpen}
              type="text"
            />
          </div>

          <div className="grid gap-2">
            <label className="ui-form-label" htmlFor="paymentCardNumber">
              Card number
            </label>
            <input
              autoComplete="cc-number"
              className="ui-form-input"
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
              <label className="ui-form-label" htmlFor="paymentExpiryMonth">
                Expiry month
              </label>
              <input
                autoComplete="cc-exp-month"
                className="ui-form-input"
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
              <label className="ui-form-label" htmlFor="paymentExpiryYear">
                Expiry year
              </label>
              <input
                autoComplete="cc-exp-year"
                className="ui-form-input"
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
              <label className="ui-form-label" htmlFor="paymentCvc">
                CVC
              </label>
              <input
                autoComplete="cc-csc"
                className="ui-form-input"
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
            <label className="ui-form-label" htmlFor="paymentBillingPostalCode">
              Billing ZIP / postal code (optional)
            </label>
            <input
              autoComplete="postal-code"
              className="ui-form-input"
              id="paymentBillingPostalCode"
              name="paymentBillingPostalCode"
              type="text"
            />
          </div>

          <SubmitButton />
        </fieldset>
      )}

      {state.status === "error" ? <p className="ui-message-error">{state.message}</p> : null}

      {state.status === "success" ? (
        <div className="ui-message-success space-y-1">
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
