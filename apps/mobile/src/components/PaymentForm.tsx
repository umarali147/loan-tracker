import { type PaymentInput, paymentInputSchema, useLoanStore } from "@loan/core";
import { Button, Input, spacing } from "@loan/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({ loanId }: { loanId: string }) {
  const addPayment = useLoanStore((s) => s.addPayment);
  const {
    control,
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
    <View style={{ gap: spacing.sm }}>
      <Controller
        control={control}
        name="amount"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Amount"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={value === undefined || value === null ? "" : String(value)}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.amount?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="date"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Date (YYYY-MM-DD)"
            placeholder="YYYY-MM-DD"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.date?.message}
            autoCapitalize="none"
          />
        )}
      />
      <Controller
        control={control}
        name="note"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Note (optional)"
            placeholder="e.g. Venmo"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      <Button
        title={isSubmitting ? "Settling…" : "Settle up"}
        onPress={submit}
        disabled={isSubmitting}
      />
    </View>
  );
}
