import { notFound } from "next/navigation";
import { DonationForm } from "@/components/donation-form";
import { getPublishedCampaignDonationTarget } from "@/lib/persistence/campaign-queries";
import { submitDonationAction } from "./actions";

type DonationPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function DonationPage({ params }: DonationPageProps) {
  const { campaignId } = await params;
  const campaign = await getPublishedCampaignDonationTarget(campaignId);

  if (!campaign) {
    notFound();
  }

  const action = submitDonationAction.bind(null, campaignId);

  return (
    <section className="ui-page-stack">
      <div className="ui-section-heading">
        <h1 className="type-section text-primary">Donate to {campaign.title}</h1>
        <p className="type-body text-secondary">{campaign.summary ?? "Support this campaign with a simulated donation flow."}</p>
      </div>
      <DonationForm action={action} />
    </section>
  );
}
