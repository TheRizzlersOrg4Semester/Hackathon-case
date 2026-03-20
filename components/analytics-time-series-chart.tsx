import type { AnalyticsTimeSeriesPoint } from "@/lib/services/analytics";

type AnalyticsTimeSeriesChartProps = {
  goalAmount?: number;
  series: AnalyticsTimeSeriesPoint[];
  variant?: "campaign" | "platform";
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(amount);
}

function getSampledLabels(series: AnalyticsTimeSeriesPoint[]): AnalyticsTimeSeriesPoint[] {
  if (series.length <= 6) {
    return series;
  }

  const step = Math.ceil(series.length / 6);
  return series.filter((_, index) => index === 0 || index === series.length - 1 || index % step === 0);
}

export function AnalyticsTimeSeriesChart({ goalAmount = 0, series, variant = "campaign" }: AnalyticsTimeSeriesChartProps) {
  if (series.length === 0) {
    return (
      <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/[0.04] p-6 text-sm text-slate-300">
        No donation activity yet. Daily analytics will appear after the first donation lands.
      </div>
    );
  }

  const width = 760;
  const height = 260;
  const paddingLeft = 18;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 42;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const stepX = series.length === 1 ? 0 : innerWidth / (series.length - 1);
  const maxDailyAmount = Math.max(...series.map((point) => point.totalAmount), 1);
  const maxCumulativeAmount = Math.max(goalAmount, series[series.length - 1]?.cumulativeAmount ?? 0, 1);
  const barWidth = Math.max(10, Math.min(28, innerWidth / Math.max(series.length * 1.75, 1)));
  const sampledLabels = getSampledLabels(series);
  const isCampaign = variant === "campaign";
  const barFill = isCampaign ? "rgba(103,232,249,0.72)" : "rgba(74,222,128,0.72)";
  const lineStroke = isCampaign ? "rgba(248,250,252,0.96)" : "rgba(125,211,252,0.95)";
  const markerFill = isCampaign ? "#f8fafc" : "#bae6fd";

  const points = series.map((point, index) => {
    const x = series.length === 1 ? paddingLeft + innerWidth / 2 : paddingLeft + index * stepX;
    const barHeight = point.totalAmount <= 0 ? 2 : Math.max(4, (point.totalAmount / maxDailyAmount) * (innerHeight - 14));
    const y = paddingTop + innerHeight - barHeight;
    const lineY = paddingTop + innerHeight - (point.cumulativeAmount / maxCumulativeAmount) * innerHeight;

    return {
      ...point,
      x,
      y,
      barHeight,
      lineY
    };
  });

  const linePoints = points.map((point) => `${point.x},${point.lineY}`).join(" ");
  const peakDay = [...series].sort((a, b) => b.totalAmount - a.totalAmount)[0] ?? series[0];
  const latestPoint = series[series.length - 1];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[1.6rem] border border-white/10 bg-[#07111d]/80 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.26)]">
        <svg aria-label="Daily donation activity and cumulative progress" className="h-auto min-w-[640px] w-full" viewBox={`0 0 ${width} ${height}`}>
          <line stroke="rgba(255,255,255,0.08)" x1={paddingLeft} x2={width - paddingRight} y1={paddingTop} y2={paddingTop} />
          <line
            stroke="rgba(255,255,255,0.08)"
            x1={paddingLeft}
            x2={width - paddingRight}
            y1={paddingTop + innerHeight / 2}
            y2={paddingTop + innerHeight / 2}
          />
          <line
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="4 4"
            x1={paddingLeft}
            x2={width - paddingRight}
            y1={paddingTop + innerHeight}
            y2={paddingTop + innerHeight}
          />

          {points.map((point) => (
            <rect
              fill={barFill}
              height={point.barHeight}
              key={point.dateKey}
              rx="6"
              width={barWidth}
              x={point.x - barWidth / 2}
              y={point.y}
            />
          ))}

          <polyline fill="none" points={linePoints} stroke={lineStroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

          {points.map((point) => (
            <circle cx={point.x} cy={point.lineY} fill={markerFill} key={`${point.dateKey}-marker`} r="3.5" />
          ))}

          {sampledLabels.map((point) => {
            const chartPoint = points.find((entry) => entry.dateKey === point.dateKey);

            if (!chartPoint) {
              return null;
            }

            return (
              <text
                fill="rgba(226,232,240,0.75)"
                fontSize="11"
                key={`${point.dateKey}-label`}
                textAnchor="middle"
                x={chartPoint.x}
                y={height - 14}
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest cumulative</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrency(latestPoint.cumulativeAmount)}</p>
          <p className="mt-1 text-sm text-slate-300">
            {goalAmount > 0 ? `${latestPoint.cumulativePercent}% of goal` : "Across the tracked platform history"}
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Peak day</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrency(peakDay.totalAmount)}</p>
          <p className="mt-1 text-sm text-slate-300">{peakDay.label}</p>
        </div>
        <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tracked days</p>
          <p className="mt-2 text-xl font-semibold">{series.length}</p>
          <p className="mt-1 text-sm text-slate-300">{series.reduce((sum, point) => sum + point.donationCount, 0)} donations</p>
        </div>
      </div>
    </div>
  );
}
