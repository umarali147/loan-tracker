"use client";

import {
  DEFAULT_CURRENCY,
  type LoanInput,
  loanInputSchema,
} from "@loan/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { CurrencySelect } from "@/components/CurrencySelect";

export interface LoanFormProps {
  defaultValues?: Partial<LoanInput>;
  submitLabel?: string;
  onSubmit: (input: LoanInput) => Promise<void>;
  onCancelHref?: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LoanForm({
  defaultValues,
  submitLabel = "Save loan",
  onSubmit,
  onCancelHref = "/",
}: LoanFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoanInput>({
    resolver: zodResolver(loanInputSchema),
    defaultValues: {
      contactName: defaultValues?.contactName ?? "",
      direction: defaultValues?.direction ?? "lent",
      principalAmount: defaultValues?.principalAmount ?? ("" as unknown as number),
      currency: defaultValues?.currency ?? DEFAULT_CURRENCY,
      dateIssued: defaultValues?.dateIssued ?? todayISO(),
      dateDue: defaultValues?.dateDue ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit(data);
    router.push("/");
    router.refresh();
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-lg">
      <div>
        <label className="block text-sm font-semibold mb-1">Direction</label>
        <Controller
          name="direction"
          control={control}
          render={({ field }) => (
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => field.onChange("lent")}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  field.value === "lent"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                I lent money
              </button>
              <button
                type="button"
                onClick={() => field.onChange("borrowed")}
                className={`flex-1 py-3 text-sm font-semibold transition border-l border-gray-300 ${
                  field.value === "borrowed"
                    ? "bg-rose-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                I borrowed money
              </button>
            </div>
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Contact name</label>
        <input
          {...register("contactName")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="e.g. Alice"
          autoComplete="off"
        />
        {errors.contactName && (
          <p className="text-sm text-rose-600 mt-1">
            {errors.contactName.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1">Amount</label>
          <input
            {...register("principalAmount")}
            type="number"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="0.00"
          />
          {errors.principalAmount && (
            <p className="text-sm text-rose-600 mt-1">
              {errors.principalAmount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Currency</label>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <CurrencySelect
                value={field.value || "USD"}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1">
            Date issued
          </label>
          <input
            {...register("dateIssued")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {errors.dateIssued && (
            <p className="text-sm text-rose-600 mt-1">
              {errors.dateIssued.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Due date (optional)
          </label>
          <input
            {...register("dateDue")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
          Notes (optional)
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="What was it for?"
        />
      </div>

      <div className="flex gap-3 mt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push(onCancelHref)}
          className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
