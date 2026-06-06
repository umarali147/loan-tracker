import type { LoanStatus } from "@loan/core";

const palette: Record<LoanStatus, { fg: string; bg: string; label: string }> = {
  active: { fg: "text-sky-700", bg: "bg-sky-100", label: "Active" },
  partial: { fg: "text-violet-700", bg: "bg-violet-100", label: "Partial" },
  settled: { fg: "text-slate-600", bg: "bg-slate-200", label: "Settled" },
  overdue: { fg: "text-amber-800", bg: "bg-amber-100", label: "Overdue" },
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  const p = palette[status];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${p.fg} ${p.bg}`}
    >
      {p.label}
    </span>
  );
}
