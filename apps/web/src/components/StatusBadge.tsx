import type { LoanStatus } from "@loan/core";

const palette: Record<LoanStatus, { fg: string; bg: string; dot: string; label: string }> = {
  active: { fg: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500", label: "Active" },
  partial: { fg: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500", label: "Partial" },
  settled: { fg: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400", label: "Settled" },
  overdue: { fg: "text-rose-700", bg: "bg-rose-50", dot: "bg-rose-500", label: "Overdue" },
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  const p = palette[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${p.fg} ${p.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
      {p.label}
    </span>
  );
}
