import { nanoid } from "nanoid";
import { create } from "zustand";
import { useAuthStore } from "./auth/store";
import { compareLoansByDueDate, deriveStatus, formatCurrency } from "./logic";
import type { LoanInput, PaymentInput } from "./schemas";
import type { StorageAdapter } from "./storage";
import {
  DEFAULT_CURRENCY,
  type FxRates,
  type Loan,
  type LoanEvent,
  type Payment,
} from "./types";

/** Human-readable list of what changed between a loan and an edit input. */
function describeLoanChanges(prev: Loan, input: LoanInput): string[] {
  const parts: string[] = [];
  const nextCurrency = input.currency || prev.currency;
  if (input.contactName !== prev.contactName) {
    parts.push(`contact "${prev.contactName}" → "${input.contactName}"`);
  }
  if (input.direction !== prev.direction) {
    parts.push(`direction ${prev.direction} → ${input.direction}`);
  }
  if (input.principalAmount !== prev.principalAmount || nextCurrency !== prev.currency) {
    parts.push(
      `amount ${formatCurrency(prev.principalAmount, prev.currency)} → ${formatCurrency(
        input.principalAmount,
        nextCurrency
      )}`
    );
  }
  if (input.dateIssued !== prev.dateIssued) {
    parts.push(`issue date ${prev.dateIssued} → ${input.dateIssued}`);
  }
  const prevDue = prev.dateDue || "";
  const nextDue = input.dateDue || "";
  if (nextDue !== prevDue) {
    if (!nextDue) parts.push("due date removed");
    else if (!prevDue) parts.push(`due date set to ${nextDue}`);
    else parts.push(`due date ${prevDue} → ${nextDue}`);
  }
  if ((input.notes || "") !== (prev.notes || "")) parts.push("notes updated");
  return parts;
}

interface LoanStoreState {
  storage: StorageAdapter | null;
  loans: Loan[];
  paymentsByLoan: Record<string, Payment[]>;
  eventsByLoan: Record<string, LoanEvent[]>;
  loading: boolean;
  initialized: boolean;

  /** User's preferred display currency (what dashboard totals convert to). */
  preferredCurrency: string;
  /** FX rates as units per 1 unit of base; null until loaded. */
  rates: Record<string, number> | null;
  ratesUpdatedAt: number | null;

  setStorage: (s: StorageAdapter) => void;
  setPreferredCurrency: (code: string) => void;
  loadRates: () => Promise<void>;
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
  eventsByLoan: {},
  loading: false,
  initialized: false,
  preferredCurrency: DEFAULT_CURRENCY,
  rates: null,
  ratesUpdatedAt: null,

  setStorage: (s) => set({ storage: s }),

  setPreferredCurrency: (code) => set({ preferredCurrency: code }),

  loadRates: async () => {
    const client = useAuthStore.getState().client;
    if (!client) return;
    try {
      const res = await client.functions.invoke<FxRates>("exchange-rates", {
        body: {},
      });
      const data = res.data?.data;
      if (data?.rates) {
        set({ rates: data.rates, ratesUpdatedAt: data.fetchedAt });
      }
    } catch {
      // Keep any previously loaded rates on failure.
    }
  },

  loadAll: async () => {
    const storage = requireStorage(get().storage);
    set({ loading: true });
    await storage.init();
    const [loans, allPayments, allEvents] = await Promise.all([
      storage.listLoans(),
      storage.listAllPayments(),
      storage.listAllEvents ? storage.listAllEvents() : Promise.resolve([]),
    ]);
    const paymentsByLoan: Record<string, Payment[]> = {};
    for (const p of allPayments) {
      (paymentsByLoan[p.loanId] ??= []).push(p);
    }
    for (const list of Object.values(paymentsByLoan)) {
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
    const eventsByLoan: Record<string, LoanEvent[]> = {};
    for (const e of allEvents) {
      (eventsByLoan[e.loanId] ??= []).push(e);
    }
    for (const list of Object.values(eventsByLoan)) {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
      eventsByLoan,
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

    // Open the shared history with a "created" entry.
    const created: LoanEvent = {
      id: nanoid(),
      loanId: id,
      kind: "created",
      message: `Loan created — ${formatCurrency(loan.principalAmount, loan.currency)} ${
        loan.direction === "lent" ? "lent to" : "borrowed from"
      } ${loan.contactName}`,
      createdAt: nowISO,
    };
    let createdOk = false;
    if (storage.createEvent) {
      try {
        await storage.createEvent(created);
        createdOk = true;
      } catch {
        createdOk = false;
      }
    }

    set((s) => ({
      loans: [...s.loans, loan].sort(compareLoansByDueDate),
      paymentsByLoan: { ...s.paymentsByLoan, [id]: [] },
      eventsByLoan: { ...s.eventsByLoan, [id]: createdOk ? [created] : [] },
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

    // Record what changed in the shared history so both parties can see it.
    const parts = describeLoanChanges(existing, input);
    let event: LoanEvent | null = null;
    if (parts.length && storage.createEvent) {
      const candidate: LoanEvent = {
        id: nanoid(),
        loanId: id,
        kind: "edited",
        message: `Edited — ${parts.join("; ")}`,
        createdAt: now.toISOString(),
      };
      try {
        await storage.createEvent(candidate);
        event = candidate;
      } catch {
        event = null;
      }
    }

    set((s) => ({
      loans: s.loans
        .map((l) => (l.id === id ? updated : l))
        .sort(compareLoansByDueDate),
      eventsByLoan: event
        ? { ...s.eventsByLoan, [id]: [...(s.eventsByLoan[id] ?? []), event] }
        : s.eventsByLoan,
    }));
  },

  removeLoan: async (id) => {
    const storage = requireStorage(get().storage);
    await storage.deleteLoan(id);
    set((s) => {
      const { [id]: _p, ...restPayments } = s.paymentsByLoan;
      const { [id]: _e, ...restEvents } = s.eventsByLoan;
      return {
        loans: s.loans.filter((l) => l.id !== id),
        paymentsByLoan: restPayments,
        eventsByLoan: restEvents,
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
