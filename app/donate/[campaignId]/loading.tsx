export default function DonationLoadingPage() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-72 animate-pulse rounded bg-brand-100" />
        <div className="h-4 w-96 animate-pulse rounded bg-brand-100" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-brand-100" />
    </section>
  );
}
