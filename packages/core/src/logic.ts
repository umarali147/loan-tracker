import type {
  DashboardSummary,
  Loan,
  LoanStatus,
  LoanSummary,
  MoneyFigure,
  Payment,
} from "./types";
import { DEFAULT_CURRENCY } from "./types";

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

/**
 * Convert `amount` from one currency to another using `rates` (units of each
 * currency per 1 unit of the rate base, e.g. USD). Returns the amount unchanged
 * when currencies match or a rate is missing (best-effort).
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> | null | undefined
): number {
  if (amount === 0 || from === to) return amount;
  if (!rates) return amount;
  const rFrom = rates[from];
  const rTo = rates[to];
  if (!rFrom || !rTo) return amount;
  return (amount / rFrom) * rTo;
}

/** Build a MoneyFigure from per-currency native sums, converting to `preferred`. */
function buildFigure(
  byCurrency: Record<string, number>,
  preferred: string,
  rates: Record<string, number> | null | undefined
): MoneyFigure {
  const currencies = Object.keys(byCurrency).filter((c) => byCurrency[c] !== 0);
  let amount = 0;
  for (const c of currencies) {
    amount += convertAmount(byCurrency[c], c, preferred, rates);
  }
  amount = roundCurrency(amount);

  if (currencies.length === 1) {
    const c = currencies[0];
    return {
      amount,
      currencies,
      mixed: false,
      nativeCurrency: c,
      nativeAmount: roundCurrency(byCurrency[c]),
    };
  }
  if (currencies.length === 0) {
    return { amount: 0, currencies: [], mixed: false, nativeCurrency: preferred, nativeAmount: 0 };
  }
  return { amount, currencies, mixed: true };
}

export interface DashboardSummaryOptions {
  preferredCurrency?: string;
  rates?: Record<string, number> | null;
  now?: Date;
}

export function computeDashboardSummary(
  loans: Loan[],
  paymentsByLoan: Record<string, Payment[]>,
  options: DashboardSummaryOptions = {}
): DashboardSummary {
  const preferred = options.preferredCurrency ?? DEFAULT_CURRENCY;
  const rates = options.rates ?? null;
  const now = options.now ?? new Date();

  const lentByCurrency: Record<string, number> = {};
  const owedByCurrency: Record<string, number> = {};
  let overdueCount = 0;

  for (const loan of loans) {
    if (loan.status === "settled") continue;
    const payments = paymentsByLoan[loan.id] ?? [];
    const remaining = computeRemainingBalance(loan, payments);
    if (remaining <= 0) continue;
    const bucket = loan.direction === "lent" ? lentByCurrency : owedByCurrency;
    bucket[loan.currency] = roundCurrency((bucket[loan.currency] ?? 0) + remaining);
    if (loan.dateDue && new Date(loan.dateDue) < startOfDay(now)) {
      overdueCount += 1;
    }
  }

  const lent = buildFigure(lentByCurrency, preferred, rates);
  const owed = buildFigure(owedByCurrency, preferred, rates);

  // Net = lent − owed, in preferred currency. Exact (native) only when every
  // contributing loan shares a single currency.
  const netCurrencies = Array.from(
    new Set([...Object.keys(lentByCurrency), ...Object.keys(owedByCurrency)])
  ).filter((c) => (lentByCurrency[c] ?? 0) !== 0 || (owedByCurrency[c] ?? 0) !== 0);
  const netAmount = roundCurrency(lent.amount - owed.amount);
  let net: MoneyFigure;
  if (netCurrencies.length === 1) {
    const c = netCurrencies[0];
    net = {
      amount: netAmount,
      currencies: netCurrencies,
      mixed: false,
      nativeCurrency: c,
      nativeAmount: roundCurrency((lentByCurrency[c] ?? 0) - (owedByCurrency[c] ?? 0)),
    };
  } else if (netCurrencies.length === 0) {
    net = { amount: 0, currencies: [], mixed: false, nativeCurrency: preferred, nativeAmount: 0 };
  } else {
    net = { amount: netAmount, currencies: netCurrencies, mixed: true };
  }

  return { preferredCurrency: preferred, lent, owed, net, overdueCount };
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
