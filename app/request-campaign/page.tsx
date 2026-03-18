import { CampaignRequestForm } from "@/app/request-campaign/request-form";

export default function RequestCampaignPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-100">Request a new campaign</h1>
        <p className="max-w-3xl text-slate-200">
          Have a cause PulseFund should host? Send a request and our admin team can approve or reject it from the review queue.
        </p>
      </div>

      <CampaignRequestForm />
    </section>
  );
}
