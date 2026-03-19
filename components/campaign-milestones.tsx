import React from "react";
import { buildCampaignMilestoneViews, type CampaignMilestone } from "@/lib/domain/campaigns";

type CampaignMilestonesProps = {
  raisedAmount: number;
  milestones: CampaignMilestone[];
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(amount);
}

export function CampaignMilestones({ raisedAmount, milestones }: CampaignMilestonesProps) {
  if (milestones.length === 0) {
    return null;
  }

  const milestoneViews = buildCampaignMilestoneViews(raisedAmount, milestones);

  return (
    <section className="ui-section-stack">
      <div className="ui-section-heading">
        <h2 className="type-section text-primary">Stretch goals</h2>
        <p className="type-body-sm max-w-3xl text-secondary">
          A simple roadmap of what unlocks as this campaign gains momentum.
        </p>
      </div>

      <div className="grid gap-3">
        {milestoneViews.map((milestone, index) => (
          <article
            className={`rounded-[1.4rem] border p-5 shadow-sm transition ${
              milestone.status === "REACHED"
                ? "border-emerald-300/40 bg-emerald-400/10 text-slate-100"
                : "border-white/10 bg-white/[0.04] text-slate-100"
            }`}
            key={milestone.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      milestone.status === "REACHED"
                        ? "bg-emerald-200/15 text-emerald-100"
                        : "bg-white/10 text-slate-200"
                    }`}
                  >
                    {milestone.status === "REACHED" ? "Reached" : "Upcoming"}
                  </span>
                  <span className={milestone.status === "REACHED" ? "text-sm text-emerald-100/80" : "text-sm text-slate-400"}>
                    Milestone {index + 1}
                  </span>
                </div>
                <h3 className={milestone.status === "REACHED" ? "text-xl font-semibold text-white" : "text-xl font-semibold text-white"}>
                  {milestone.title}
                </h3>
                {milestone.description ? (
                  <p className={milestone.status === "REACHED" ? "text-sm leading-relaxed text-slate-200" : "text-sm leading-relaxed text-slate-300"}>
                    {milestone.description}
                  </p>
                ) : null}
              </div>

              <div className="text-right">
                <p className={milestone.status === "REACHED" ? "text-xs uppercase tracking-[0.16em] text-emerald-100/75" : "text-xs uppercase tracking-[0.16em] text-slate-400"}>
                  Target
                </p>
                <p className={milestone.status === "REACHED" ? "mt-1 text-xl font-semibold text-white" : "mt-1 text-xl font-semibold text-white"}>
                  {formatCurrency(milestone.targetAmount)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="type-meta text-muted">Current raised amount: {formatCurrency(raisedAmount)}</p>
    </section>
  );
}
