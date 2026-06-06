# Product Requirements Document
## Loan Tracker — Lean MVP (Hybrid Mobile + Web)

**Version:** 1.1
**Date:** May 2026
**Status:** Build-in-progress (single session)
**Stack:** React Native (Expo) + Next.js — shared TypeScript monorepo

> **v1.1 notes:** This version supersedes v1.0. Scope is reduced to P0 features only, deliverable in a single session. Auth, cloud sync, notifications, search/filter, contacts grouping, soft-delete, export, and the multi-week milestone roadmap are deferred. The architecture (shared core + per-platform apps) is preserved so deferred features can land later without rework.

---

## 1. Purpose

People frequently lend or borrow money informally — between friends, family, and colleagues — with no structured way to track the details. Loan Tracker gives individuals a simple, private, local-first tool to record, monitor, and settle informal loans across mobile and web from a single shared codebase.

---

## 2. Goals

- Make it effortless to log a loan in under 30 seconds.
- Give users a real-time, accurate picture of their lending/borrowing position.
- Work on iOS, Android, and desktop/web browsers from one codebase.
- Local-first — no account needed, no network required.

---

## 3. Target Users

Adults who lend or borrow money informally and want a private record without using a shared expense-splitting app.

**Out of scope (v1.1):** business/bank loans, shared multi-user ledgers, interest, group splitting, payment processing.

---

## 4. Platform & Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native via Expo (iOS + Android), Expo Router |
| Web | Next.js 15 (App Router) |
| Monorepo | Turborepo + pnpm workspaces |
| Shared logic | `packages/core` — TypeScript types, Zod schemas, business logic, Zustand store, `StorageAdapter` interface |
| Shared UI | `packages/ui` — primitives (Button, Card, Badge, Input) via `react-native-web` |
| Shared config | `packages/config` — shared `tsconfig.base.json` |
| Web storage | Dexie (IndexedDB) |
| Mobile storage | `expo-sqlite` (async API) |
| Forms | React Hook Form + Zod (shared schemas from `packages/core`) |
| State | Zustand |
| Currency | Hardcoded USD (single currency in v1.1) |
| Auth | None (v1.1 is local-only) |
| Cloud sync | None (v1.1) |

### Monorepo Structure

```
/
├── apps/
│   ├── mobile/          # Expo React Native app (Expo Router)
│   └── web/             # Next.js app (App Router)
├── packages/
│   ├── core/            # Types, Zod schemas, logic, Zustand store, StorageAdapter
│   ├── ui/              # Cross-platform primitives
│   └── config/          # Shared tsconfig
```

---

## 5. Features

### 5.1 Dashboard (P0)

The main screen. Shows the user's overall financial position at a glance.

| ID | Requirement |
|---|---|
| DASH-01 | Display total amount lent out (sum of remaining balances of active "lent" loans) |
| DASH-02 | Display total amount owed (sum of remaining balances of active "borrowed" loans) |
| DASH-03 | Display net position (lent − owed) with positive/negative indicator |
| DASH-04 | List active loans sorted by due date (loans without a due date come last) |
| DASH-05 | Visual badge on overdue loans |
| DASH-06 | Quick-add button to log a new loan |

### 5.2 Loan Management (P0)

#### Create
| ID | Requirement |
|---|---|
| LOAN-01 | User can create a loan with: contact name, amount, direction (lent / borrowed), date issued |
| LOAN-02 | Optional fields: due date, notes |
| LOAN-03 | Direction toggle — "I lent" vs "I borrowed" — prominent and clearly labeled |
| LOAN-04 | Form validates: amount > 0, contact name not empty |
| LOAN-05 | Date issued defaults to today |

#### View
| ID | Requirement |
|---|---|
| LOAN-07 | Loan detail screen shows all fields, payment history, remaining balance, status |
| LOAN-08 | Status chip: Active / Partial / Settled / Overdue |
| LOAN-09 | Remaining balance computed from `principalAmount - sum(payments)` |

#### Edit & Delete
| ID | Requirement |
|---|---|
| LOAN-10 | User can edit any field on an existing loan |
| LOAN-11 | User can delete a loan with confirmation dialog (hard delete — cascades payments) |

### 5.3 Repayment Tracking (P0)

| ID | Requirement |
|---|---|
| PAY-01 | User can log a payment (partial or full) against any active loan |
| PAY-02 | Payment entry requires: amount, date |
| PAY-03 | Optional payment note |
| PAY-04 | Loan status auto-updates to "Settled" when remaining balance reaches 0 |
| PAY-05 | Payment history displayed in chronological order on the loan detail screen |
| PAY-06 | User can delete a mistakenly logged payment |

### 5.4 Contact Field (P0)

| ID | Requirement |
|---|---|
| CONT-04 | Contact name is a free-text field (no account linking, no grouping view in v1.1) |

### 5.5 Archive (P0)

| ID | Requirement |
|---|---|
| HIST-01 | Settled loans move to an Archive section (hidden from the main dashboard) |
| HIST-03 | User can reopen a settled loan by editing it (e.g. raising the amount) |

### 5.6 Storage (P0)

| ID | Requirement |
|---|---|
| SYNC-01 | All data stored locally (no network, no account) — Dexie on web, expo-sqlite on mobile |

---

## 6. UX & Design Principles

- **Speed first** — logging a loan should take under 30 seconds.
- **Clarity over cleverness** — balances and statuses are immediately readable.
- **Calm design** — neutral, trustworthy tones. Overdue indicators are clear but not aggressive.
- **Mobile-first** — thumb-friendly; web adapts.
- **Consistency** — shared primitives ensure visual continuity across platforms.

---

## 7. Navigation Structure

### Mobile (Bottom Tabs)

```
Dashboard  |  Archive
        (FAB on Dashboard for quick-add)
```

### Web (Sidebar)

```
├── Dashboard
└── Archive
```

---

## 8. Data Model

### Loan

```typescript
type Loan = {
  id: string;
  contactName: string;
  direction: 'lent' | 'borrowed';
  principalAmount: number;
  currency: string;            // hardcoded "USD" in v1.1
  dateIssued: string;          // ISO 8601
  dateDue?: string;
  notes?: string;
  status: 'active' | 'partial' | 'settled' | 'overdue';
  createdAt: string;
  updatedAt: string;
};
```

### Payment

```typescript
type Payment = {
  id: string;
  loanId: string;
  amount: number;
  date: string;                // ISO 8601
  note?: string;
  createdAt: string;
};
```

### Derived (computed)

```typescript
type LoanSummary = {
  remainingBalance: number;    // principal - sum(payments)
  totalPaid: number;
  isOverdue: boolean;
};

type DashboardSummary = {
  totalLent: number;
  totalOwed: number;
  netPosition: number;
  overdueCount: number;
};
```

### Status derivation rules

- `remaining <= 0` → `settled`
- else if `dateDue && now > dateDue` → `overdue`
- else if any payments exist → `partial`
- else → `active`

Status is persisted on every write so list views don't need to recompute.

---

## 9. Shared Code Strategy

| Package | Contents |
|---|---|
| `packages/core` | Types, Zod schemas, `StorageAdapter` interface, business logic (`computeRemainingBalance`, `deriveStatus`, `computeDashboardSummary`), Zustand store |
| `packages/ui` | Cross-platform primitives (`Button`, `Card`, `Badge`, `Input`, `tokens`) using `react-native` + `react-native-web` |
| `packages/config` | Shared `tsconfig.base.json` |

**Forms are NOT shared.** Each app implements its own `LoanForm` / `PaymentForm` using React Hook Form bound to the shared Zod schemas. Sharing form components across web and native costs more than it saves for v1.1.

Platform-specific code lives in `apps/mobile` and `apps/web`.

---

## 10. Single-Session Build Checklist

1. Rewrite this PRD (this step).
2. Monorepo skeleton (`pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `apps/` + `packages/` dirs).
3. `packages/config` — shared `tsconfig.base.json`.
4. `packages/core` — types, schemas, storage interface, logic, Zustand store.
5. `packages/ui` — primitives + tokens.
6. `apps/web` — Next.js scaffold, Dexie adapter, routes, sidebar nav.
7. `apps/mobile` — Expo scaffold, Metro monorepo config, SQLite adapter, screens, tab nav.
8. End-to-end verification on both platforms.

---

## 11. Out of Scope (deferred from v1.0)

- Authentication (any form)
- Cloud sync / multi-device
- Notifications (push or email)
- Search and filter
- Contacts grouping view
- Multiple currencies
- Soft-delete and 30-day recovery
- CSV export
- Settings screen (theme, currency, notifications)
- Sharing loan records
- PWA offline shell on web
- Address book integration on mobile

These features can land on top of the v1.1 architecture without rework — they're descoped, not designed out.

---

*End of PRD v1.1*
