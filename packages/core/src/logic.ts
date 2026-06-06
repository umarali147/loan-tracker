import type {
  DashboardSummary,
  Loan,
  LoanStatus,
  LoanSummary,
  Payment,
} from "./types";

export function computeTotalPaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export function computeRemainingBalance(
  loan: Loan,
  payments: Payment[]
): number {
  const remaining = loan.principalAmount - computeTotalPaid(payments);
  return Math.max(0, roundCurrency(remaining));
}

export function deriveStatus(
  loan: Loan,
  payments: Payment[],
  now: Date = new Date()
): LoanStatus {
  const remaining = computeRemainingBalance(loan, payments);
  if (remaining <= 0) return "settled";
  if (loan.dateDue && new Date(loan.dateDue) < startOfDay(now)) return "overdue";
  if (payments.length > 0) return "partial";
  return "active";
}

export function computeLoanSummary(
  loan: Loan,
  payments: Payment[],
  now: Date = new Date()
): LoanSummary {
  const totalPaid = computeTotalPaid(payments);
  const remainingBalance = computeRemainingBalance(loan, payments);
  const isOverdue =
    !!loan.dateDue &&
    new Date(loan.dateDue) < startOfDay(now) &&
    remainingBalance > 0;
  return { remainingBalance, totalPaid, isOverdue };
}

export function computeDashboardSummary(
  loans: Loan[],
  paymentsByLoan: Record<string, Payment[]>,
  now: Date = new Date()
): DashboardSummary {
  let totalLent = 0;
  let totalOwed = 0;
  let overdueCount = 0;

  for (const loan of loans) {
    if (loan.status === "settled") continue;
    const payments = paymentsByLoan[loan.id] ?? [];
    const remaining = computeRemainingBalance(loan, payments);
    if (remaining <= 0) continue;
    if (loan.direction === "lent") totalLent += remaining;
    else totalOwed += remaining;
    if (loan.dateDue && new Date(loan.dateDue) < startOfDay(now)) {
      overdueCount += 1;
    }
  }

  return {
    totalLent: roundCurrency(totalLent),
    totalOwed: roundCurrency(totalOwed),
    netPosition: roundCurrency(totalLent - totalOwed),
    overdueCount,
  };
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function roundCurrency(n: number): number {
  return Math.round(n * 100) / 100;
}

export function compareLoansByDueDate(a: Loan, b: Loan): number {
  if (!a.dateDue && !b.dateDue) return a.createdAt.localeCompare(b.createdAt);
  if (!a.dateDue) return 1;
  if (!b.dateDue) return -1;
  return a.dateDue.localeCompare(b.dateDue);
}

export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
