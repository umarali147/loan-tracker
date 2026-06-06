import type { Loan, Payment, StorageAdapter } from "@loan/core";
import Dexie, { type EntityTable } from "dexie";

class LoanTrackerDB extends Dexie {
  loans!: EntityTable<Loan, "id">;
  payments!: EntityTable<Payment, "id">;

  constructor() {
    super("LoanTrackerDB");
    this.version(1).stores({
      loans: "id, status, direction, dateDue, createdAt",
      payments: "id, loanId, date",
    });
  }
}

export class DexieStorageAdapter implements StorageAdapter {
  private db = new LoanTrackerDB();

  async init(): Promise<void> {
    await this.db.open();
  }

  async listLoans(): Promise<Loan[]> {
    return this.db.loans.toArray();
  }

  async getLoan(id: string): Promise<Loan | null> {
    return (await this.db.loans.get(id)) ?? null;
  }

  async createLoan(loan: Loan): Promise<void> {
    await this.db.loans.put(loan);
  }

  async updateLoan(id: string, patch: Partial<Loan>): Promise<void> {
    await this.db.loans.update(id, patch);
  }

  async deleteLoan(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.loans, this.db.payments, async () => {
      await this.db.payments.where("loanId").equals(id).delete();
      await this.db.loans.delete(id);
    });
  }

  async listPayments(loanId: string): Promise<Payment[]> {
    return this.db.payments.where("loanId").equals(loanId).toArray();
  }

  async listAllPayments(): Promise<Payment[]> {
    return this.db.payments.toArray();
  }

  async createPayment(payment: Payment): Promise<void> {
    await this.db.payments.put(payment);
  }

  async deletePayment(id: string): Promise<void> {
    await this.db.payments.delete(id);
  }
}
