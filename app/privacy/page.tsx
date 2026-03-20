import Link from "next/link";

const sections = [
  {
    title: "Data collected",
    body:
      "PulseFund MVP stores donation amount, donation type, optional donor name, optional donor email, supporter access code references, optional tax deduction details, and limited admin workflow records."
  },
  {
    title: "Purpose",
    body:
      "We use this data to simulate donations, issue receipts, support thank-you flows, power admin analytics, and prepare simple tax-related reporting for eligible donations."
  },
  {
    title: "Anonymity handling",
    body:
      "When a donor chooses anonymity, public-facing views avoid showing their identity. Admin views may still retain limited operational donation data for moderation, support, and reporting."
  },
  {
    title: "Data minimization",
    body:
      "PulseFund avoids full donor accounts for the MVP. Instead, supporter access codes provide lookup capability with less personal data than a full identity and password system."
  },
  {
    title: "Storage",
    body:
      "Donation and campaign records are stored in the application database. Optional tax deduction identifiers are stored only when a donor explicitly marks a donation as tax eligible."
  },
  {
    title: "User rights",
    body:
      "In a fuller product, donors should be able to request access, correction, deletion, and export of relevant personal data. This MVP page exists to document that intent and current limitations."
  },
  {
    title: "Future improvements",
    body:
      "Future iterations should add clearer retention periods, operational deletion tooling, consent flows, stronger data export paths, and more complete legal copy for production use."
  }
];

export default function PrivacyPage() {
  return (
    <section className="space-y-8">
      <div className="analytics-hero px-6 py-7 md:px-8 md:py-8">
        <div className="analytics-hero-glow" />
        <div className="relative space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/85">Privacy / GDPR</p>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">Minimal privacy documentation for the PulseFund MVP.</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
              This page documents what the MVP stores today, why that data exists, how anonymity is handled, and what should improve before any production-style launch.
            </p>
          </div>

          <Link className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 backdrop-blur" href="/">
            Back to PulseFund
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <article className="analytics-panel p-5 md:p-6" key={section.title}>
            <h2 className="text-xl font-semibold text-slate-50">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
