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

export interface LoanSummary {
  remainingBalance: number;
  totalPaid: number;
  isOverdue: boolean;
}

export interface DashboardSummary {
  totalLent: number;
  totalOwed: number;
  netPosition: number;
  overdueCount: number;
}

export const DEFAULT_CURRENCY = "USD";
