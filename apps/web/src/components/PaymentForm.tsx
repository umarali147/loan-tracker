"use client";

import { type PaymentInput, paymentInputSchema, useLoanStore } from "@loan/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({ loanId }: { loanId: string }) {
  const addPayment = useLoanStore((s) => s.addPayment);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentInputSchema),
    defaultValues: {
      amount: "" as unknown as number,
      date: todayISO(),
      note: "",
    },
  });

  const submit = handleSubmit(async (data) => {
    await addPayment(loanId, data);
    reset({ amount: "" as unknown as number, date: todayISO(), note: "" });
  });

  return (
    <form
      onSubmit={submit}
      className="flex flex-col sm:flex-row gap-2 sm:items-end"
    >
      <div className="flex-1">
        <label className="block text-xs font-semibold mb-1 text-gray-600">
          Amount
        </label>
        <input
          {...register("amount")}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.amount && (
          <p className="text-xs text-rose-600 mt-1">{errors.amount.message}</p>
        )}
      </div>
      <div className="flex-1">
        <label className="block text-xs font-semibold mb-1 text-gray-600">
          Date
        </label>
        <input
          {...register("date")}
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {errors.date && (
          <p className="text-xs text-rose-600 mt-1">{errors.date.message}</p>
        )}
      </div>
      <div className="flex-1">
        <label className="block text-xs font-semibold mb-1 text-gray-600">
          Note (optional)
        </label>
        <input
          {...register("note")}
          placeholder="e.g. Venmo"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50"
      >
        {isSubmitting ? "Settling…" : "Settle up"}
      </button>
    </form>
  );
}
