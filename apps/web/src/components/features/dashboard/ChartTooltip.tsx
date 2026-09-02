interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-surface-400 bg-surface-100 p-3 shadow-elevated">
      {label && <p className="text-sm font-medium text-surface-950 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-surface-700 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="font-medium text-surface-950">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}
