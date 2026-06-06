"use client";

import { useLoanStore } from "@loan/core";
import Link from "next/link";
import { LoanForm } from "@/components/LoanForm";

export default function NewLoanPage() {
  const addLoan = useLoanStore((s) => s.addLoan);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-teal-700 hover:underline font-medium"
        >
          ← Back to dashboard
        </Link>
        <h2 className="text-2xl font-bold mt-2">New loan</h2>
      </div>
      <LoanForm
        submitLabel="Create loan"
        onSubmit={async (input) => {
          await addLoan(input);
        }}
      />
    </div>
  );
}
