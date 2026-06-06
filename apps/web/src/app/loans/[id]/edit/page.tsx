"use client";

import { useLoanStore } from "@loan/core";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoanForm } from "@/components/LoanForm";

export default function EditLoanPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const loan = useLoanStore((s) => s.loans.find((l) => l.id === id));
  const editLoan = useLoanStore((s) => s.editLoan);

  if (!loan) {
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/loans/${loan.id}`}
          className="text-sm text-teal-700 hover:underline font-medium"
        >
          ← Back to loan
        </Link>
        <h2 className="text-2xl font-bold mt-2">Edit loan</h2>
      </div>
      <LoanForm
        submitLabel="Save changes"
        defaultValues={{
          contactName: loan.contactName,
          direction: loan.direction,
          principalAmount: loan.principalAmount,
          currency: loan.currency,
          dateIssued: loan.dateIssued.slice(0, 10),
          dateDue: loan.dateDue?.slice(0, 10),
          notes: loan.notes,
        }}
        onCancelHref={`/loans/${loan.id}`}
        onSubmit={async (input) => {
          await editLoan(loan.id, input);
        }}
      />
    </div>
  );
}
