import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="space-y-4 rounded-xl border border-brand-100 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-brand-900">Page not found</h1>
      <p className="text-brand-900">The page you requested does not exist or is not currently available.</p>
      <div className="flex gap-4 text-sm">
        <Link className="font-medium text-brand-700 underline" href="/">
          Back to home
        </Link>
        <Link className="font-medium text-brand-700 underline" href="/campaigns">
          Browse campaigns
        </Link>
      </div>
    </section>
  );
}
