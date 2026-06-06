"use client";

import {
  computeLoanSummary,
  formatCurrency,
  type Payment,
  useLoanStore,
} from "@loan/core";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { PaymentForm } from "@/components/PaymentForm";
import { StatusBadge } from "@/components/StatusBadge";

const EMPTY_PAYMENTS: Payment[] = [];

export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const loan = useLoanStore((s) => s.loans.find((l) => l.id === id));
  const paymentsRaw = useLoanStore((s) => s.paymentsByLoan[id]);
  const payments = paymentsRaw ?? EMPTY_PAYMENTS;
  const removeLoan = useLoanStore((s) => s.removeLoan);
  const removePayment = useLoanStore((s) => s.removePayment);

  const summary = useMemo(
    () => (loan ? computeLoanSummary(loan, payments) : null),
    [loan, payments]
  );

  if (!loan || !summary) {
    return (
      <div>
        <Link
          href="/"
          className="text-sm text-teal-700 hover:underline font-medium"
        >
          ← Back to dashboard
        </Link>
        <p className="mt-6 text-slate-500">Loan not found.</p>
      </div>
    );
  }

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
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-teal-700 hover:underline font-medium"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold">{loan.contactName}</h2>
            <StatusBadge status={loan.status} />
          </div>
          <div
            className={`text-sm font-semibold ${
              loan.direction === "lent" ? "text-teal-700" : "text-amber-800"
            }`}
          >
            {loan.direction === "lent"
              ? "You lent this money"
              : "You borrowed this money"}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/loans/${loan.id}/edit`}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-sm"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <Stat
          label="Principal"
          value={formatCurrency(loan.principalAmount, loan.currency)}
        />
        <Stat
          label="Paid"
          value={formatCurrency(summary.totalPaid, loan.currency)}
        />
        <Stat
          label="Remaining"
          value={formatCurrency(summary.remainingBalance, loan.currency)}
          accent
        />
      </div>

      <dl className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
        <Row label="Date issued" value={new Date(loan.dateIssued).toLocaleDateString()} />
        <Row
          label="Due date"
          value={
            loan.dateDue ? new Date(loan.dateDue).toLocaleDateString() : "—"
          }
        />
        <Row label="Currency" value={loan.currency} />
        <Row label="Notes" value={loan.notes || "—"} />
      </dl>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Log a payment</h3>
        {loan.status === "settled" ? (
          <p className="text-sm text-slate-500">
            This loan is settled. Edit it to add more principal if needed.
          </p>
        ) : (
          <PaymentForm loanId={loan.id} />
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Payment history</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments logged yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {payments
              .slice()
              .reverse()
              .map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3"
                >
                  <div>
                    <div className="font-semibold">
                      {formatCurrency(p.amount, loan.currency)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(p.date).toLocaleDateString()}
                      {p.note ? ` · ${p.note}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => removePayment(loan.id, p.id)}
                    className="text-xs text-amber-800 hover:underline font-semibold"
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
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
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div
        className={`text-xl font-bold mt-1 ${accent ? "text-teal-700" : "text-slate-900"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 font-medium">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}
