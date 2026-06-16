"use client";

import {
  computeDashboardSummary,
  computeRemainingBalance,
  formatCurrency,
  useLoanStore,
  type Loan,
  type MoneyFigure,
} from "@loan/core";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { CurrencySelect } from "@/components/CurrencySelect";
import { StatusBadge } from "@/components/StatusBadge";

type LoanFilter = "all" | "active" | "archive";
const PREF_CURRENCY_KEY = "preferredCurrency";

/** Exact native value for single-currency figures; ≈ converted for mixed. */
function fmtFigure(figure: MoneyFigure, preferred: string, sign = false): string {
  const exact = !figure.mixed;
  const value = exact ? figure.nativeAmount ?? figure.amount : figure.amount;
  const currency = exact ? figure.nativeCurrency ?? preferred : preferred;
  const prefix = (figure.mixed ? "≈ " : "") + (sign && value > 0 ? "+" : "");
  return prefix + formatCurrency(value, currency);
}

export default function DashboardPage() {
  const loans = useLoanStore((s) => s.loans);
  const paymentsByLoan = useLoanStore((s) => s.paymentsByLoan);
  const preferredCurrency = useLoanStore((s) => s.preferredCurrency);
  const setPreferredCurrency = useLoanStore((s) => s.setPreferredCurrency);
  const rates = useLoanStore((s) => s.rates);

  const [filter, setFilter] = useState<LoanFilter>("all");

  useEffect(() => {
    const saved = window.localStorage.getItem(PREF_CURRENCY_KEY);
    if (saved) setPreferredCurrency(saved);
  }, [setPreferredCurrency]);

  const changeCurrency = (code: string) => {
    setPreferredCurrency(code);
    window.localStorage.setItem(PREF_CURRENCY_KEY, code);
  };

  const summary = useMemo(
    () =>
      computeDashboardSummary(loans, paymentsByLoan, {
        preferredCurrency,
        rates,
      }),
    [loans, paymentsByLoan, preferredCurrency, rates]
  );

  // Newest activity first, so a loan jumps to the top whenever it's updated
  // (e.g. just settled). Settled loans stay visible; filter narrows the view.
  const visibleLoans = useMemo(() => {
    const byRecency = [...loans].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    if (filter === "active") return byRecency.filter((l) => l.status !== "settled");
    if (filter === "archive") return byRecency.filter((l) => l.status === "settled");
    return byRecency;
  }, [loans, filter]);

  const net = summary.net;
  const netColor = net.amount >= 0 ? "text-emerald-700" : "text-rose-600";

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Track who owes what, in any currency.
          </p>
        </div>
        <Link
          href="/loans/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">New loan</span>
        </Link>
      </div>

      {/* Overview: net (left) + lent/owed (right on desktop, below on mobile). */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm text-gray-500 font-medium">Net position</span>
          <div className="w-[5.5rem] shrink-0">
            <CurrencySelect value={preferredCurrency} onChange={changeCurrency} />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className={`text-3xl font-bold tracking-tight ${netColor}`}>
              {fmtFigure(net, preferredCurrency, true)}
            </div>
            {net.mixed && (
              <div className="text-xs text-gray-400 mt-0.5">
                converted from {net.currencies.join(", ")}
              </div>
            )}
          </div>

          <div className="flex items-stretch gap-5 sm:gap-8 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
            <FigureMini
              label="Lent out"
              figure={summary.lent}
              preferred={preferredCurrency}
              tone="positive"
              icon={<ArrowUpRight size={14} />}
            />
            <div className="w-px self-stretch bg-gray-100" />
            <FigureMini
              label="Owed"
              figure={summary.owed}
              preferred={preferredCurrency}
              tone="negative"
              icon={<ArrowDownLeft size={14} />}
            />
          </div>
        </div>
      </div>

      {summary.overdueCount > 0 && (
        <div className="mb-5 flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium">
          <TriangleAlert size={16} className="shrink-0" />
          {summary.overdueCount} loan{summary.overdueCount === 1 ? "" : "s"} overdue
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Loans
        </h3>
        <div className="flex rounded-lg bg-gray-100 p-0.5 text-sm font-medium">
          {(["all", "active", "archive"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md capitalize transition ${
                filter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visibleLoans.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
          {filter === "archive" ? (
            "No settled loans yet."
          ) : (
            <>
              No loans yet.{" "}
              <Link
                href="/loans/new"
                className="text-emerald-700 font-semibold hover:underline"
              >
                Log your first one
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleLoans.map((loan) => (
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

function FigureMini({
  label,
  figure,
  preferred,
  tone,
  icon,
}: {
  label: string;
  figure: MoneyFigure;
  preferred: string;
  tone: "positive" | "negative";
  icon: React.ReactNode;
}) {
  const valueColor = tone === "positive" ? "text-emerald-700" : "text-rose-600";
  const chip =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-600"
      : "bg-rose-50 text-rose-500";
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md ${chip}`}>
          {icon}
        </span>
        {label}
      </div>
      <div className={`text-lg font-bold tracking-tight mt-1 truncate ${valueColor}`}>
        {fmtFigure(figure, preferred)}
      </div>
    </div>
  );
}

function LoanRow({ loan, remaining }: { loan: Loan; remaining: number }) {
  const dueLabel = loan.dateDue
    ? `Due ${new Date(loan.dateDue).toLocaleDateString()}`
    : "No due date";
  const isLent = loan.direction === "lent";
  return (
    <li>
      <Link
        href={`/loans/${loan.id}`}
        className="group flex items-center gap-3 bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-sm rounded-2xl px-4 py-3 transition"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold">
          {loan.contactName?.[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{loan.contactName}</span>
            <StatusBadge status={loan.status} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span className={isLent ? "text-emerald-700 font-medium" : "text-rose-600 font-medium"}>
              {isLent ? "Lent" : "Borrowed"}
            </span>
            <span className="text-gray-300">·</span>
            <span>{dueLabel}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-semibold tracking-tight">
            {formatCurrency(remaining, loan.currency)}
          </div>
          <div className="text-xs text-gray-400">
            of {formatCurrency(loan.principalAmount, loan.currency)}
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-gray-300 group-hover:text-emerald-500 transition shrink-0"
        />
      </Link>
    </li>
  );
}
