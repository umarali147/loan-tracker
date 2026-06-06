import { z } from "zod";

export const loanInputSchema = z.object({
  contactName: z.string().trim().min(1, "Contact name is required"),
  direction: z.enum(["lent", "borrowed"]),
  principalAmount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  currency: z.string().default("USD"),
  dateIssued: z.string().min(1, "Date issued is required"),
  dateDue: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  notes: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type LoanInput = z.infer<typeof loanInputSchema>;

export const paymentInputSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  note: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;
