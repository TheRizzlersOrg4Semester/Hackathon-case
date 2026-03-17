type CampaignDonationFeedPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function CampaignDonationFeedPage({ params }: CampaignDonationFeedPageProps) {
  const { campaignId } = await params;

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold text-brand-900">Campaign Donation Feed</h1>
      <p className="text-brand-900">Campaign ID: {campaignId}</p>
      <p className="text-brand-900">Placeholder for campaign-specific donation timeline and summary signals.</p>
    </section>
  );
}
