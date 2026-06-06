"use client";

import {
  compareLoansByDueDate,
  computeDashboardSummary,
  computeRemainingBalance,
  formatCurrency,
  useLoanStore,
  type Loan,
} from "@loan/core";
import Link from "next/link";
import { useMemo } from "react";
import { StatusBadge } from "@/components/StatusBadge";

export default function DashboardPage() {
  const loans = useLoanStore((s) => s.loans);
  const paymentsByLoan = useLoanStore((s) => s.paymentsByLoan);

  const summary = useMemo(
    () => computeDashboardSummary(loans, paymentsByLoan),
    [loans, paymentsByLoan]
  );

  const activeLoans = useMemo(
    () =>
      loans
        .filter((l) => l.status !== "settled")
        .sort(compareLoansByDueDate),
    [loans]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Link
          href="/loans/new"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
        >
          + New loan
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Lent out" amount={summary.totalLent} tone="positive" />
        <SummaryCard label="Owed" amount={summary.totalOwed} tone="negative" />
        <SummaryCard
          label="Net position"
          amount={summary.netPosition}
          tone={summary.netPosition >= 0 ? "positive" : "negative"}
          highlightSign
        />
      </div>

      {summary.overdueCount > 0 && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          {summary.overdueCount} loan{summary.overdueCount === 1 ? "" : "s"}{" "}
          overdue
        </div>
      )}

      <h3 className="text-lg font-semibold mb-3">Active loans</h3>
      {activeLoans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          No active loans yet.{" "}
          <Link
            href="/loans/new"
            className="text-teal-700 font-semibold underline"
          >
            Log your first one
          </Link>
          .
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {activeLoans.map((loan) => (
            <LoanRow
              key={loan.id}
              loan={loan}
              remaining={computeRemainingBalance(
                loan,
                paymentsByLoan[loan.id] ?? []
              )}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  tone,
  highlightSign,
}: {
  label: string;
  amount: number;
  tone: "positive" | "negative";
  highlightSign?: boolean;
}) {
  const color = tone === "positive" ? "text-teal-700" : "text-amber-800";
  const sign = highlightSign && amount > 0 ? "+" : "";
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>
        {sign}
        {formatCurrency(amount)}
      </div>
    </div>
  );
}

function LoanRow({ loan, remaining }: { loan: Loan; remaining: number }) {
  const dueLabel = loan.dateDue
    ? `Due ${new Date(loan.dateDue).toLocaleDateString()}`
    : "No due date";
  return (
    <li>
      <Link
        href={`/loans/${loan.id}`}
        className="flex items-center justify-between gap-4 bg-white border border-slate-200 hover:border-teal-400 rounded-xl px-4 py-3 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{loan.contactName}</span>
            <StatusBadge status={loan.status} />
            <span
              className={`text-xs font-semibold ${
                loan.direction === "lent" ? "text-teal-700" : "text-amber-800"
              }`}
            >
              {loan.direction === "lent" ? "Lent" : "Borrowed"}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{dueLabel}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">
            {formatCurrency(remaining, loan.currency)}
          </div>
          <div className="text-xs text-slate-500">
            of {formatCurrency(loan.principalAmount, loan.currency)}
          </div>
        </div>
      </Link>
    </li>
  );
}
