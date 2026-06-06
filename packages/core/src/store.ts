import { nanoid } from "nanoid";
import { create } from "zustand";
import { compareLoansByDueDate, deriveStatus } from "./logic";
import type { LoanInput, PaymentInput } from "./schemas";
import type { StorageAdapter } from "./storage";
import { DEFAULT_CURRENCY, type Loan, type Payment } from "./types";

interface LoanStoreState {
  storage: StorageAdapter | null;
  loans: Loan[];
  paymentsByLoan: Record<string, Payment[]>;
  loading: boolean;
  initialized: boolean;

  setStorage: (s: StorageAdapter) => void;
  loadAll: () => Promise<void>;

  addLoan: (input: LoanInput) => Promise<string>;
  editLoan: (id: string, input: LoanInput) => Promise<void>;
  removeLoan: (id: string) => Promise<void>;

  addPayment: (loanId: string, input: PaymentInput) => Promise<void>;
  removePayment: (loanId: string, paymentId: string) => Promise<void>;
}

function requireStorage(s: StorageAdapter | null): StorageAdapter {
  if (!s) throw new Error("StorageAdapter not set. Call setStorage() first.");
  return s;
}

export const useLoanStore = create<LoanStoreState>((set, get) => ({
  storage: null,
  loans: [],
  paymentsByLoan: {},
  loading: false,
  initialized: false,

  setStorage: (s) => set({ storage: s }),

  loadAll: async () => {
    const storage = requireStorage(get().storage);
    set({ loading: true });
    await storage.init();
    const [loans, allPayments] = await Promise.all([
      storage.listLoans(),
      storage.listAllPayments(),
    ]);
    const paymentsByLoan: Record<string, Payment[]> = {};
    for (const p of allPayments) {
      (paymentsByLoan[p.loanId] ??= []).push(p);
    }
    for (const list of Object.values(paymentsByLoan)) {
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
    loans.sort(compareLoansByDueDate);

    const refreshed: Loan[] = [];
    const now = new Date();
    for (const loan of loans) {
      const pays = paymentsByLoan[loan.id] ?? [];
      const status = deriveStatus(loan, pays, now);
      if (status !== loan.status) {
        const updatedAt = now.toISOString();
        await storage.updateLoan(loan.id, { status, updatedAt });
        refreshed.push({ ...loan, status, updatedAt });
      } else {
        refreshed.push(loan);
      }
    }

    set({
      loans: refreshed,
      paymentsByLoan,
      loading: false,
      initialized: true,
    });
  },

  addLoan: async (input) => {
    const storage = requireStorage(get().storage);
    const now = new Date();
    const nowISO = now.toISOString();
    const id = nanoid();
    const loan: Loan = {
      id,
      contactName: input.contactName,
      direction: input.direction,
      principalAmount: input.principalAmount,
      currency: input.currency || DEFAULT_CURRENCY,
      dateIssued: input.dateIssued,
      dateDue: input.dateDue,
      notes: input.notes,
      status: "active",
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    loan.status = deriveStatus(loan, [], now);
    await storage.createLoan(loan);
    set((s) => ({
      loans: [...s.loans, loan].sort(compareLoansByDueDate),
      paymentsByLoan: { ...s.paymentsByLoan, [id]: [] },
    }));
    return id;
  },

  editLoan: async (id, input) => {
    const storage = requireStorage(get().storage);
    const existing = get().loans.find((l) => l.id === id);
    if (!existing) throw new Error(`Loan ${id} not found`);
    const now = new Date();
    const updated: Loan = {
      ...existing,
      contactName: input.contactName,
      direction: input.direction,
      principalAmount: input.principalAmount,
      currency: input.currency || existing.currency,
      dateIssued: input.dateIssued,
      dateDue: input.dateDue,
      notes: input.notes,
      updatedAt: now.toISOString(),
    };
    const pays = get().paymentsByLoan[id] ?? [];
    updated.status = deriveStatus(updated, pays, now);
    await storage.updateLoan(id, updated);
    set((s) => ({
      loans: s.loans
        .map((l) => (l.id === id ? updated : l))
        .sort(compareLoansByDueDate),
    }));
  },

  removeLoan: async (id) => {
    const storage = requireStorage(get().storage);
    await storage.deleteLoan(id);
    set((s) => {
      const { [id]: _, ...rest } = s.paymentsByLoan;
      return {
        loans: s.loans.filter((l) => l.id !== id),
        paymentsByLoan: rest,
      };
    });
  },

  addPayment: async (loanId, input) => {
    const storage = requireStorage(get().storage);
    const loan = get().loans.find((l) => l.id === loanId);
    if (!loan) throw new Error(`Loan ${loanId} not found`);
    const now = new Date();
    const payment: Payment = {
      id: nanoid(),
      loanId,
      amount: input.amount,
      date: input.date,
      note: input.note,
      createdAt: now.toISOString(),
    };
    await storage.createPayment(payment);
    const pays = [...(get().paymentsByLoan[loanId] ?? []), payment].sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    const newStatus = deriveStatus(loan, pays, now);
    const updatedLoan: Loan = {
      ...loan,
      status: newStatus,
      updatedAt: now.toISOString(),
    };
    await storage.updateLoan(loanId, {
      status: newStatus,
      updatedAt: updatedLoan.updatedAt,
    });
    set((s) => ({
      paymentsByLoan: { ...s.paymentsByLoan, [loanId]: pays },
      loans: s.loans.map((l) => (l.id === loanId ? updatedLoan : l)),
    }));
  },

  removePayment: async (loanId, paymentId) => {
    const storage = requireStorage(get().storage);
    const loan = get().loans.find((l) => l.id === loanId);
    if (!loan) throw new Error(`Loan ${loanId} not found`);
    await storage.deletePayment(paymentId);
    const remaining = (get().paymentsByLoan[loanId] ?? []).filter(
      (p) => p.id !== paymentId
    );
    const now = new Date();
    const newStatus = deriveStatus(loan, remaining, now);
    const updatedLoan: Loan = {
      ...loan,
      status: newStatus,
      updatedAt: now.toISOString(),
    };
    await storage.updateLoan(loanId, {
      status: newStatus,
      updatedAt: updatedLoan.updatedAt,
    });
    set((s) => ({
      paymentsByLoan: { ...s.paymentsByLoan, [loanId]: remaining },
      loans: s.loans.map((l) => (l.id === loanId ? updatedLoan : l)),
    }));
  },
}));
