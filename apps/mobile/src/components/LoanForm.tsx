import {
  DEFAULT_CURRENCY,
  type LoanInput,
  loanInputSchema,
} from "@loan/core";
import { Button, Input, colors, radius, spacing, typography } from "@loan/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export interface LoanFormProps {
  defaultValues?: Partial<LoanInput>;
  submitLabel?: string;
  onSubmit: (input: LoanInput) => Promise<void>;
  onCancel?: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LoanForm({
  defaultValues,
  submitLabel = "Save loan",
  onSubmit,
  onCancel,
}: LoanFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoanInput>({
    resolver: zodResolver(loanInputSchema),
    defaultValues: {
      contactName: defaultValues?.contactName ?? "",
      direction: defaultValues?.direction ?? "lent",
      principalAmount:
        defaultValues?.principalAmount !== undefined
          ? defaultValues.principalAmount
          : ("" as unknown as number),
      currency: defaultValues?.currency ?? DEFAULT_CURRENCY,
      dateIssued: defaultValues?.dateIssued ?? todayISO(),
      dateDue: defaultValues?.dateDue ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={styles.fieldLabel}>Direction</Text>
      <Controller
        control={control}
        name="direction"
        render={({ field }) => (
          <View style={styles.directionRow}>
            <Pressable
              onPress={() => field.onChange("lent")}
              style={[
                styles.directionBtn,
                field.value === "lent" && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.directionLabel,
                  field.value === "lent" && { color: "#fff" },
                ]}
              >
                I lent money
              </Text>
            </Pressable>
            <Pressable
              onPress={() => field.onChange("borrowed")}
              style={[
                styles.directionBtn,
                field.value === "borrowed" && {
                  backgroundColor: colors.danger,
                  borderColor: colors.danger,
                },
              ]}
            >
              <Text
                style={[
                  styles.directionLabel,
                  field.value === "borrowed" && { color: "#fff" },
                ]}
              >
                I borrowed money
              </Text>
            </Pressable>
          </View>
        )}
      />

      <Controller
        control={control}
        name="contactName"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Contact name"
            placeholder="e.g. Alice"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.contactName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="principalAmount"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Amount (USD)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={value === undefined || value === null ? "" : String(value)}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.principalAmount?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="dateIssued"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Date issued (YYYY-MM-DD)"
            placeholder="YYYY-MM-DD"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.dateIssued?.message}
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="dateDue"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Due date (optional, YYYY-MM-DD)"
            placeholder="YYYY-MM-DD"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Notes (optional)"
            placeholder="What was it for?"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: "top" }}
          />
        )}
      />

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button
            title={isSubmitting ? "Saving…" : submitLabel}
            onPress={submit}
            disabled={isSubmitting}
          />
        </View>
        {onCancel && (
          <View style={{ flex: 1 }}>
            <Button title="Cancel" onPress={onCancel} variant="secondary" />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  directionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  directionLabel: {
    ...typography.label,
    color: colors.text,
  },
});
