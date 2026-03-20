import { CampaignRequestForm } from "@/app/request-campaign/request-form";

export default function RequestCampaignPage() {
  return (
    <section className="ui-page-stack">
      <div className="ui-section-heading">
        <h1 className="type-section text-primary">Request a new campaign</h1>
        <p className="type-body max-w-3xl text-secondary">
          Have a cause PulseFund should host? Send a request and our admin team can approve or reject it from the review queue.
        </p>
      </div>

      <CampaignRequestForm />
    </section>
  );
}
