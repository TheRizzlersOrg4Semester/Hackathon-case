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
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-brand-900">Donate to {campaign.title}</h1>
        <p className="text-brand-900">{campaign.summary ?? "Support this campaign with a simulated donation flow."}</p>
      </div>
      <DonationForm action={action} />
    </section>
  );
}
