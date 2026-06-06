import type { Loan, Payment, StorageAdapter } from "@loan/core";
import * as SQLite from "expo-sqlite";

interface LoanRow {
  id: string;
  contactName: string;
  direction: string;
  principalAmount: number;
  currency: string;
  dateIssued: string;
  dateDue: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentRow {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

function rowToLoan(r: LoanRow): Loan {
  return {
    id: r.id,
    contactName: r.contactName,
    direction: r.direction as Loan["direction"],
    principalAmount: r.principalAmount,
    currency: r.currency,
    dateIssued: r.dateIssued,
    dateDue: r.dateDue ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status as Loan["status"],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function rowToPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    loanId: r.loanId,
    amount: r.amount,
    date: r.date,
    note: r.note ?? undefined,
    createdAt: r.createdAt,
  };
}

export class SQLiteStorageAdapter implements StorageAdapter {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await SQLite.openDatabaseAsync("loan-tracker.db");
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY NOT NULL,
        contactName TEXT NOT NULL,
        direction TEXT NOT NULL,
        principalAmount REAL NOT NULL,
        currency TEXT NOT NULL,
        dateIssued TEXT NOT NULL,
        dateDue TEXT,
        notes TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        loanId TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_payments_loanId ON payments(loanId);
    `);
  }

  private get d(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error("SQLiteStorageAdapter not initialized");
    return this.db;
  }

  async listLoans(): Promise<Loan[]> {
    const rows = await this.d.getAllAsync<LoanRow>("SELECT * FROM loans");
    return rows.map(rowToLoan);
  }

  async getLoan(id: string): Promise<Loan | null> {
    const row = await this.d.getFirstAsync<LoanRow>(
      "SELECT * FROM loans WHERE id = ?",
      [id]
    );
    return row ? rowToLoan(row) : null;
  }

  async createLoan(loan: Loan): Promise<void> {
    await this.d.runAsync(
      `INSERT INTO loans (id, contactName, direction, principalAmount, currency, dateIssued, dateDue, notes, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loan.id,
        loan.contactName,
        loan.direction,
        loan.principalAmount,
        loan.currency,
        loan.dateIssued,
        loan.dateDue ?? null,
        loan.notes ?? null,
        loan.status,
        loan.createdAt,
        loan.updatedAt,
      ]
    );
  }

  async updateLoan(id: string, patch: Partial<Loan>): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    const allowed: (keyof Loan)[] = [
      "contactName",
      "direction",
      "principalAmount",
      "currency",
      "dateIssued",
      "dateDue",
      "notes",
      "status",
      "updatedAt",
    ];
    for (const key of allowed) {
      if (key in patch) {
        fields.push(`${key} = ?`);
        const v = patch[key];
        values.push(v === undefined ? null : (v as string | number));
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    await this.d.runAsync(
      `UPDATE loans SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  }

  async deleteLoan(id: string): Promise<void> {
    await this.d.withTransactionAsync(async () => {
      await this.d.runAsync("DELETE FROM payments WHERE loanId = ?", [id]);
      await this.d.runAsync("DELETE FROM loans WHERE id = ?", [id]);
    });
  }

  async listPayments(loanId: string): Promise<Payment[]> {
    const rows = await this.d.getAllAsync<PaymentRow>(
      "SELECT * FROM payments WHERE loanId = ? ORDER BY date ASC",
      [loanId]
    );
    return rows.map(rowToPayment);
  }

  async listAllPayments(): Promise<Payment[]> {
    const rows = await this.d.getAllAsync<PaymentRow>(
      "SELECT * FROM payments ORDER BY date ASC"
    );
    return rows.map(rowToPayment);
  }

  async createPayment(p: Payment): Promise<void> {
    await this.d.runAsync(
      `INSERT INTO payments (id, loanId, amount, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [p.id, p.loanId, p.amount, p.date, p.note ?? null, p.createdAt]
    );
  }

  async deletePayment(id: string): Promise<void> {
    await this.d.runAsync("DELETE FROM payments WHERE id = ?", [id]);
  }
}
