"use client";

import { formatCurrency, useLoanStore } from "@loan/core";
import Link from "next/link";
import { useMemo } from "react";
import { StatusBadge } from "@/components/StatusBadge";

export default function ArchivePage() {
  const loans = useLoanStore((s) => s.loans);
  const settled = useMemo(
    () =>
      loans
        .filter((l) => l.status === "settled")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [loans]
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Archive</h2>

      {settled.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          No settled loans yet. Loans move here once their remaining balance
          reaches 0.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {settled.map((loan) => (
            <li key={loan.id}>
              <Link
                href={`/loans/${loan.id}`}
                className="flex items-center justify-between gap-4 bg-white border border-gray-200 hover:border-emerald-400 rounded-xl px-4 py-3 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{loan.contactName}</span>
                    <StatusBadge status={loan.status} />
                    <span
                      className={`text-xs font-semibold ${
                        loan.direction === "lent"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {loan.direction === "lent" ? "Lent" : "Borrowed"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Settled · {new Date(loan.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-700">
                    {formatCurrency(loan.principalAmount, loan.currency)}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
