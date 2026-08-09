export function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-emerald-500 transition-[stroke-dashoffset] duration-500"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="rotate-90 fill-foreground text-xl font-semibold"
          style={{ transformOrigin: "50px 50px" }}
        >
          {Math.round(percent)}%
        </text>
      </svg>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
