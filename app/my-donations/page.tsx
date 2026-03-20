import { MyDonationsLookup } from "@/app/my-donations/my-donations-lookup";

export default function MyDonationsPage() {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-100">My Donations</h1>
        <p className="max-w-3xl text-slate-200">
          Use your Supporter Access Code to look up your donation history and receipt details. This is a lightweight V1 lookup flow, not full account login.
        </p>
      </div>

      <MyDonationsLookup />
    </section>
  );
}
