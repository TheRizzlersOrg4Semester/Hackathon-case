type AdminMilestoneField = {
  id?: string;
  title?: string | null;
  description?: string | null;
  targetAmount?: number;
  displayOrder?: number;
};

type AdminMilestoneFieldsProps = {
  milestones?: AdminMilestoneField[];
  maxRows?: number;
};

export function AdminMilestoneFields({ milestones = [], maxRows = 4 }: AdminMilestoneFieldsProps) {
  const sortedMilestones = [...milestones].sort((left, right) => {
    const leftOrder = left.displayOrder ?? 0;
    const rightOrder = right.displayOrder ?? 0;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return (left.targetAmount ?? 0) - (right.targetAmount ?? 0);
  });

  const rows = Array.from({ length: Math.max(maxRows, sortedMilestones.length || 0) }, (_, index) => {
    const milestone = sortedMilestones[index];

    return {
      id: milestone?.id ?? "",
      title: milestone?.title ?? "",
      description: milestone?.description ?? "",
      targetAmount: milestone?.targetAmount ?? "",
      displayOrder: milestone?.displayOrder ?? index + 1
    };
  });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-50">Stretch goals and milestones</h3>
        <p className="mt-1 text-sm text-slate-300">
          Add up to {rows.length} roadmap milestones. Clearing a filled row removes it, and display order controls the sequence.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4" key={`${row.id || "new"}-${index}`}>
            <input name="milestoneId" type="hidden" value={row.id} />

            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Milestone {index + 1}</p>
              <label className="space-y-1 text-sm font-medium text-slate-100">
                Display order
                <input
                  className="w-24 rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
                  defaultValue={row.displayOrder}
                  min={1}
                  name="milestoneDisplayOrder"
                  step={1}
                  type="number"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_180px]">
              <label className="space-y-1 text-sm font-medium text-slate-100">
                Title
                <input
                  className="w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
                  defaultValue={row.title}
                  name="milestoneTitle"
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-100">
                Target amount (DKK)
                <input
                  className="w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
                  defaultValue={row.targetAmount}
                  min={1}
                  name="milestoneTargetAmount"
                  step={1}
                  type="number"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-1 text-sm font-medium text-slate-100">
              Description (optional)
              <textarea
                className="min-h-24 w-full rounded-lg border border-white/20 bg-white/92 px-3 py-2 text-slate-900"
                defaultValue={row.description}
                name="milestoneDescription"
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
