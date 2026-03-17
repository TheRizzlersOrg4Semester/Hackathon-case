export default function CampaignDetailLoadingPage() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-6 w-28 animate-pulse rounded bg-brand-100" />
      <div className="h-9 w-72 animate-pulse rounded bg-brand-100" />
      <div className="h-56 animate-pulse rounded-xl bg-brand-100" />
      <div className="h-64 animate-pulse rounded-xl bg-brand-100" />
    </section>
  );
}
