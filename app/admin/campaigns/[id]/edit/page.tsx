type AdminEditCampaignPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditCampaignPage({ params }: AdminEditCampaignPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold text-brand-900">Edit Campaign</h1>
      <p className="text-brand-900">Campaign ID: {id}</p>
      <p className="text-brand-900">Placeholder for editing basic campaign fields and status transitions.</p>
    </section>
  );
}
