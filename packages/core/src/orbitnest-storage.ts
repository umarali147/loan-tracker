import type { OrbitNestClient } from "@orbitnest/node";
import type { StorageAdapter } from "./storage";
import type { Loan, LoanEvent, Payment } from "./types";

/** Returns the current user access token (or null) for per-user scoping. */
export type TokenGetter = () => string | null | undefined;

/**
 * StorageAdapter backed by OrbitNest edge functions. Drop-in replacement for
 * the local Dexie/SQLite adapters — the store and UI are unchanged. Each method
 * invokes the matching edge function; the user token (when signed in) is passed
 * in the request body as `_accessToken` (a custom header would be blocked by the
 * function gateway's CORS preflight).
 */
export class OrbitNestStorageAdapter implements StorageAdapter {
  constructor(
    private client: OrbitNestClient,
    private getToken: TokenGetter = () => null,
  ) {}

  private async call<T>(fn: string, body: Record<string, unknown>): Promise<T> {
    const token = this.getToken();
    const res = await this.client.functions.invoke<T>(fn, {
      body: token ? { ...body, _accessToken: token } : body,
    });
    if (res.error || res.data?.data === undefined) {
      throw new Error(res.error?.message ?? `OrbitNest function "${fn}" failed`);
    }
    return res.data.data;
  }

  async init(): Promise<void> {
    // No client-side setup; tables/functions live on OrbitNest.
  }

  async listLoans(): Promise<Loan[]> {
    const { loans } = await this.call<{ loans: Loan[] }>("list-loans", {});
    return loans;
  }

  async getLoan(id: string): Promise<Loan | null> {
    const loans = await this.listLoans();
    return loans.find((l) => l.id === id) ?? null;
  }

  async createLoan(loan: Loan): Promise<void> {
    await this.call<{ loan: Loan }>("create-loan", { loan });
  }

  async updateLoan(id: string, patch: Partial<Loan>): Promise<void> {
    await this.call<{ loan: Loan }>("update-loan", { id, patch });
  }

  async deleteLoan(id: string): Promise<void> {
    await this.call<{ success: boolean }>("delete-loan", { id });
  }

  async listPayments(loanId: string): Promise<Payment[]> {
    const all = await this.listAllPayments();
    return all.filter((p) => p.loanId === loanId);
  }

  async listAllPayments(): Promise<Payment[]> {
    const { payments } = await this.call<{ payments: Payment[] }>("list-payments", {});
    return payments;
  }

  async createPayment(payment: Payment): Promise<void> {
    await this.call<{ payment: Payment }>("create-payment", { payment });
  }

  async deletePayment(id: string): Promise<void> {
    await this.call<{ success: boolean }>("delete-payment", { id });
  }

  async listAllEvents(): Promise<LoanEvent[]> {
    const { events } = await this.call<{ events: LoanEvent[] }>("list-events", {});
    return events;
  }

  async createEvent(event: LoanEvent): Promise<void> {
    await this.call<{ event: LoanEvent }>("create-event", { event });
  }
}
