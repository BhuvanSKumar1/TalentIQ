/**
 * Small inline badge to indicate demo/fictional data.
 * Used next to candidate names, metrics, etc.
 */
export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/8 text-brand-300 border border-brand-500/15 ${className}`}
    >
      Demo
    </span>
  );
}
