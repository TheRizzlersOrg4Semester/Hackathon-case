"use client";

import { useActionState } from "react";
import { submitCampaignRequestAction, type CampaignRequestFormState } from "@/app/request-campaign/actions";

const initialState: CampaignRequestFormState = {
  status: "idle"
};

export function CampaignRequestForm() {
  const [state, formAction, isPending] = useActionState(submitCampaignRequestAction, initialState);

  return (
    <form action={formAction} className="ui-form-panel space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="ui-form-label">
          Requester name
          <input className="ui-form-input" name="requesterName" required />
        </label>
        <label className="ui-form-label">
          Requester email
          <input className="ui-form-input" name="requesterEmail" required type="email" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="ui-form-label">
          Campaign title
          <input className="ui-form-input" name="title" required />
        </label>
        <label className="ui-form-label">
          Category
          <input className="ui-form-input" name="category" placeholder="Education, Health, Environment..." required />
        </label>
      </div>

      <label className="ui-form-label block">
        One-line summary
        <input className="ui-form-input" name="summary" required />
      </label>

      <label className="ui-form-label block">
        Full description
        <textarea className="ui-form-textarea min-h-32" name="description" required />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="ui-form-label">
          Goal amount (DKK)
          <input className="ui-form-input" min={1} name="goalAmount" required step="1" type="number" />
        </label>
        <label className="ui-form-label">
          Motivation
          <textarea className="ui-form-textarea min-h-24" name="motivation" required />
        </label>
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "ui-message-error" : "ui-message-success"}>
          {state.message}
        </p>
      ) : null}

      <button
        className="ui-button-primary"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Submitting request..." : "Submit campaign request"}
      </button>
    </form>
  );
}
