import Link from "next/link";

export default function HistoryIndexPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold text-brand-900">Donation History</h1>
      <ul className="space-y-2">
        <li>
          <Link className="text-brand-700 underline" href="/my-donations">
            My Donations lookup
          </Link>
        </li>
        <li className="text-brand-900">Campaign donation feed is accessed via `/history/campaign/[campaignId]`.</li>
      </ul>
    </section>
  );
}
