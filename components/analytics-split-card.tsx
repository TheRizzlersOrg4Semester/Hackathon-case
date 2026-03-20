type AnalyticsSplitCardItem = {
  label: string;
  value: string;
  hint: string;
  percent: number;
  tone?: "teal" | "sky" | "slate";
};

type AnalyticsSplitCardProps = {
  title: string;
  description: string;
  items: [AnalyticsSplitCardItem, AnalyticsSplitCardItem];
};

const trackToneStyles = {
  teal: "from-emerald-300 via-teal-300 to-cyan-300",
  sky: "from-sky-300 via-cyan-300 to-indigo-300",
  slate: "from-slate-200 via-slate-300 to-white"
};

export function AnalyticsSplitCard({ title, description, items }: AnalyticsSplitCardProps) {
  return (
    <div className="analytics-panel space-y-4 p-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
        <p className="mt-1 text-sm text-slate-300">{description}</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const tone = item.tone ?? "teal";

          return (
            <div className="space-y-2" key={item.label}>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.hint}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-50">{item.value}</p>
                  <p className="text-xs text-slate-400">{item.percent.toFixed(1)}%</p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${trackToneStyles[tone]}`}
                  style={{ width: `${Math.max(item.percent, item.percent > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
