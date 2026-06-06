import type { Loan, Payment } from "./types";

export interface StorageAdapter {
  init(): Promise<void>;

  listLoans(): Promise<Loan[]>;
  getLoan(id: string): Promise<Loan | null>;
  createLoan(loan: Loan): Promise<void>;
  updateLoan(id: string, patch: Partial<Loan>): Promise<void>;
  deleteLoan(id: string): Promise<void>;

  listPayments(loanId: string): Promise<Payment[]>;
  listAllPayments(): Promise<Payment[]>;
  createPayment(payment: Payment): Promise<void>;
  deletePayment(id: string): Promise<void>;
}
