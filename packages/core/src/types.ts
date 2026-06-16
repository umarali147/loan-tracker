export type Direction = "lent" | "borrowed";

export type LoanStatus = "active" | "partial" | "settled" | "overdue";

export interface Loan {
  id: string;
  contactName: string;
  direction: Direction;
  principalAmount: number;
  currency: string;
  dateIssued: string;
  dateDue?: string;
  notes?: string;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export type LoanEventKind = "created" | "edited" | "settled";

/** An entry in a loan's shared history (e.g. created, terms edited). Visible to
 *  both parties so changes to a loan are never silent. */
export interface LoanEvent {
  id: string;
  loanId: string;
  kind: LoanEventKind;
  message: string;
  createdAt: string;
}

export interface LoanSummary {
  remainingBalance: number;
  totalPaid: number;
  isOverdue: boolean;
}

/**
 * One dashboard money figure. `amount` is the total expressed in the user's
 * preferred currency. When the figure draws on a single source currency we also
 * expose it natively (`nativeCurrency`/`nativeAmount`) so the UI can show an
 * exact value; when it mixes currencies, `mixed` is true and the UI should show
 * the converted `amount` prefixed with ≈.
 */
export interface MoneyFigure {
  amount: number;
  currencies: string[];
  mixed: boolean;
  nativeCurrency?: string;
  nativeAmount?: number;
}

export interface DashboardSummary {
  preferredCurrency: string;
  lent: MoneyFigure;
  owed: MoneyFigure;
  net: MoneyFigure;
  overdueCount: number;
}

/** Exchange rates expressed as units of each currency per 1 unit of `base`. */
export interface FxRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

export const DEFAULT_CURRENCY = "USD";
