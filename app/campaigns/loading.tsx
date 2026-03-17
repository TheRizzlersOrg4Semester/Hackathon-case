export default function CampaignsLoadingPage() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded bg-brand-100" />
        <div className="h-4 w-80 animate-pulse rounded bg-brand-100" />
      </div>
      <div className="grid gap-4">
        <div className="h-44 animate-pulse rounded-xl bg-brand-100" />
        <div className="h-44 animate-pulse rounded-xl bg-brand-100" />
      </div>
    </section>
  );
}
