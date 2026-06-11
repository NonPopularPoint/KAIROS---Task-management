interface ProgressBarProps {
  value: number;
  max?: number;
  showPercentage?: boolean;
  className?: string;
}

function colorByPct(pct: number) {
  if (pct >= 90) return "bg-teal-500";
  if (pct >= 70) return "bg-amber-500";
  if (pct >= 30) return "bg-kairos-500";
  return "bg-gray-400";
}

export function ProgressBar({ value, max = 100, showPercentage, className = "" }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        {showPercentage && <span className="text-xs text-gray-500">{Math.round(pct)}%</span>}
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorByPct(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
