"use client";

import {
  computeLoanSummary,
  formatCurrency,
  type LoanEvent,
  type Payment,
  useLoanStore,
} from "@loan/core";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { PaymentForm } from "@/components/PaymentForm";
import { StatusBadge } from "@/components/StatusBadge";

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_EVENTS: LoanEvent[] = [];

export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const loan = useLoanStore((s) => s.loans.find((l) => l.id === id));
  const paymentsRaw = useLoanStore((s) => s.paymentsByLoan[id]);
  const payments = paymentsRaw ?? EMPTY_PAYMENTS;
  const eventsRaw = useLoanStore((s) => s.eventsByLoan[id]);
  const events = eventsRaw ?? EMPTY_EVENTS;
  const removeLoan = useLoanStore((s) => s.removeLoan);
  const removePayment = useLoanStore((s) => s.removePayment);

  const summary = useMemo(
    () => (loan ? computeLoanSummary(loan, payments) : null),
    [loan, payments]
  );

  if (!loan || !summary) {
    return (
      <div>
        <BackLink />
        <p className="mt-6 text-gray-500">Loan not found.</p>
      </div>
    );
  }

  const isLent = loan.direction === "lent";

  const handleDelete = async () => {
    if (!confirm(`Delete the loan with ${loan.contactName}? This cannot be undone.`)) {
      return;
    }
    await removeLoan(loan.id);
    router.push("/");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-5">
        <BackLink />
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-lg font-semibold">
            {loan.contactName?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-2xl font-bold tracking-tight">{loan.contactName}</h2>
              <StatusBadge status={loan.status} />
            </div>
            <div
              className={`text-sm font-medium ${
                isLent ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {isLent ? "You lent this money" : "You borrowed this money"}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/loans/${loan.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-sm transition"
          >
            <Pencil size={15} /> Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 font-semibold rounded-lg text-sm transition"
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Principal" value={formatCurrency(loan.principalAmount, loan.currency)} />
        <Stat label="Paid" value={formatCurrency(summary.totalPaid, loan.currency)} />
        <Stat
          label="Remaining"
          value={formatCurrency(summary.remainingBalance, loan.currency)}
          accent
        />
      </div>

      <dl className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
        <Row label="Date issued" value={new Date(loan.dateIssued).toLocaleDateString()} />
        <Row
          label="Due date"
          value={loan.dateDue ? new Date(loan.dateDue).toLocaleDateString() : "—"}
        />
        <Row label="Currency" value={loan.currency} />
        <Row label="Notes" value={loan.notes || "—"} />
      </dl>

      <section className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Settle up
        </h3>
        {loan.status === "settled" ? (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm rounded-xl px-4 py-3">
            This loan is fully settled. Edit it to add more principal if needed.
          </div>
        ) : (
          <PaymentForm loanId={loan.id} />
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          History
        </h3>
        <HistoryTimeline
          payments={payments}
          events={events}
          currency={loan.currency}
          onDeletePayment={(pid) => removePayment(loan.id, pid)}
        />
      </section>
    </div>
  );
}

type TimelineItem =
  | { id: string; ts: string; type: "payment"; payment: Payment }
  | { id: string; ts: string; type: "event"; event: LoanEvent };

function HistoryTimeline({
  payments,
  events,
  currency,
  onDeletePayment,
}: {
  payments: Payment[];
  events: LoanEvent[];
  currency: string;
  onDeletePayment: (id: string) => void;
}) {
  const items: TimelineItem[] = [
    ...payments.map(
      (p): TimelineItem => ({ id: `p_${p.id}`, ts: p.createdAt || p.date, type: "payment", payment: p })
    ),
    ...events.map(
      (e): TimelineItem => ({ id: `e_${e.id}`, ts: e.createdAt, type: "event", event: e })
    ),
  ].sort((a, b) => b.ts.localeCompare(a.ts));

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) =>
        item.type === "payment" ? (
          <li
            key={item.id}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Banknote size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold tracking-tight">
                Payment · {formatCurrency(item.payment.amount, currency)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {new Date(item.payment.date).toLocaleDateString()}
                {item.payment.note ? ` · ${item.payment.note}` : ""}
              </div>
            </div>
            <button
              onClick={() => onDeletePayment(item.payment.id)}
              title="Delete payment"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ) : (
          <li
            key={item.id}
            className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
          >
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                item.event.kind === "created"
                  ? "bg-gray-100 text-gray-500"
                  : item.event.kind === "settled"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
              }`}
            >
              {item.event.kind === "created" ? (
                <Plus size={16} />
              ) : item.event.kind === "settled" ? (
                <CheckCircle2 size={16} />
              ) : (
                <Pencil size={15} />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800">{item.event.message}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {new Date(item.event.createdAt).toLocaleString()}
              </div>
            </div>
          </li>
        )
      )}
    </ul>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700 font-medium transition"
    >
      <ArrowLeft size={16} /> Back to dashboard
    </Link>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-xl font-bold tracking-tight mt-1.5 ${
          accent ? "text-emerald-700" : "text-gray-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 font-medium">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value}</dd>
    </div>
  );
}
