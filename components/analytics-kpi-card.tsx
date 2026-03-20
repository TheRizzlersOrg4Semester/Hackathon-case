type AnalyticsKpiCardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "teal" | "sky" | "slate";
};

const toneStyles = {
  teal: "from-emerald-300/28 via-teal-300/12 to-transparent text-emerald-100",
  sky: "from-sky-300/28 via-cyan-300/12 to-transparent text-sky-100",
  slate: "from-white/18 via-white/6 to-transparent text-slate-100"
};

export function AnalyticsKpiCard({ label, value, detail, tone = "slate" }: AnalyticsKpiCardProps) {
  return (
    <article className="analytics-kpi-card">
      <div className={`analytics-kpi-card__glow bg-gradient-to-br ${toneStyles[tone]}`} />
      <div className="relative space-y-2">
        <p className="analytics-kpi-label">{label}</p>
        <p className="analytics-kpi-value">{value}</p>
        {detail ? <p className="analytics-kpi-detail">{detail}</p> : null}
      </div>
    </article>
  );
}
