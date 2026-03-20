import Link from "next/link";

const termsSections = [
  {
    title: "1. Acceptance of the Terms",
    text: "By accessing or using PulseFund, you agree to follow these Terms of Service and any applicable laws and regulations."
  },
  {
    title: "2. Platform Purpose",
    text: "PulseFund is a donation platform for browsing campaigns, making contributions, and reviewing campaign momentum through public progress and donor activity features."
  },
  {
    title: "3. Donation Flow",
    text: "Donations submitted through the site must use accurate information. During demo or development phases, some payment experiences may be simulated rather than processed by a live payment provider."
  },
  {
    title: "4. Donor Information",
    text: "You are responsible for ensuring that the donor name, email address, and any other details you submit are accurate and belong to you or to a person you are authorized to represent."
  },
  {
    title: "5. Anonymous Donations",
    text: "If you choose anonymous visibility, PulseFund will hide your identity from public campaign views, while still retaining internal records needed for operations, compliance, and support."
  },
  {
    title: "6. Campaign Content",
    text: "Campaign organizers are responsible for the truthfulness, legality, and accuracy of their campaign descriptions, media, goals, and updates."
  },
  {
    title: "7. Acceptable Use",
    text: "You must not misuse the platform, attempt unauthorized access, upload malicious content, interfere with donations, or use the service for unlawful, deceptive, or abusive activity."
  },
  {
    title: "8. Refunds and Corrections",
    text: "Refunds, reversals, and corrections may be handled according to the campaign, the platform operator, and the payment method used. PulseFund may correct technical mistakes or cancel invalid transactions when necessary."
  },
  {
    title: "9. Intellectual Property",
    text: "PulseFund, its interface, branding, and original content remain the property of the platform or its licensors. Users retain rights to content they lawfully upload, while granting PulseFund the right to display it within the service."
  },
  {
    title: "10. Privacy and Data Handling",
    text: "Your use of the site is also subject to the platform's privacy and data-handling practices. Personal information may be processed for donations, receipts, support, fraud prevention, analytics, and legal compliance."
  },
  {
    title: "11. Service Availability",
    text: "PulseFund may change, pause, or remove features at any time. The platform does not guarantee uninterrupted availability and may perform maintenance, fixes, or temporary shutdowns when needed."
  },
  {
    title: "12. Changes to the Terms",
    text: "These terms may be updated over time. Continued use of the site after updates means you accept the revised version in effect at that time."
  }
] as const;

export default function TermsOfServicePage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">PulseFund Policy</p>
          <h1 className="text-4xl font-semibold text-slate-100">Terms of Service</h1>
          <p className="max-w-3xl text-slate-300">
            These terms describe the rules, responsibilities, and platform conditions that apply when using PulseFund.
          </p>
        </div>

        <Link className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-slate-100" href="/">
          Back to home
        </Link>
      </div>

      <div className="grid gap-4">
        {termsSections.map((section) => (
          <article className="landing-panel space-y-3 p-5 md:p-6" key={section.title}>
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <p className="max-w-4xl text-sm leading-7 text-slate-200">{section.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
