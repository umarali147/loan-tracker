import {
  computeLoanSummary,
  formatCurrency,
  type Payment,
  useLoanStore,
} from "@loan/core";

const EMPTY_PAYMENTS: Payment[] = [];
import { Badge, Button, Card, colors, spacing, typography } from "@loan/ui";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { PaymentForm } from "../../../src/components/PaymentForm";

export default function LoanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const loan = useLoanStore((s) => s.loans.find((l) => l.id === id));
  const paymentsRaw = useLoanStore((s) => s.paymentsByLoan[id ?? ""]);
  const payments = paymentsRaw ?? EMPTY_PAYMENTS;
  const removeLoan = useLoanStore((s) => s.removeLoan);
  const removePayment = useLoanStore((s) => s.removePayment);

  const summary = useMemo(
    () => (loan ? computeLoanSummary(loan, payments) : null),
    [loan, payments]
  );

  if (!loan || !summary) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.textMuted }}>Loan not found.</Text>
      </View>
    );
  }

  const confirmDelete = () => {
    Alert.alert(
      "Delete loan",
      `Delete the loan with ${loan.contactName}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeLoan(loan.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.contactName}>{loan.contactName}</Text>
            <Badge status={loan.status} />
          </View>
          <Text
            style={{
              ...typography.label,
              color:
                loan.direction === "lent" ? colors.positive : colors.negative,
              marginTop: 4,
            }}
          >
            {loan.direction === "lent"
              ? "You lent this money"
              : "You borrowed this money"}
          </Text>
        </View>
      </View>

      <View style={[styles.actionRow, { marginTop: spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Link href={`/loans/${loan.id}/edit`} asChild>
            <Button title="Edit" variant="secondary" />
          </Link>
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Delete" variant="danger" onPress={confirmDelete} />
        </View>
      </View>

      <View style={[styles.statsRow, { marginTop: spacing.lg }]}>
        <Stat label="Principal" value={formatCurrency(loan.principalAmount)} />
        <Stat label="Paid" value={formatCurrency(summary.totalPaid)} />
        <Stat
          label="Remaining"
          value={formatCurrency(summary.remainingBalance)}
          accent
        />
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <DetailRow
          label="Date issued"
          value={new Date(loan.dateIssued).toLocaleDateString()}
        />
        <DetailRow
          label="Due date"
          value={
            loan.dateDue ? new Date(loan.dateDue).toLocaleDateString() : "—"
          }
        />
        <DetailRow label="Currency" value={loan.currency} />
        <DetailRow label="Notes" value={loan.notes || "—"} last />
      </Card>

      <Text style={styles.sectionHeader}>Log a payment</Text>
      {loan.status === "settled" ? (
        <Text style={{ color: colors.textMuted }}>
          This loan is settled. Edit it to raise the principal if needed.
        </Text>
      ) : (
        <PaymentForm loanId={loan.id} />
      )}

      <Text style={styles.sectionHeader}>Payment history</Text>
      {payments.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>No payments logged yet.</Text>
      ) : (
        payments
          .slice()
          .reverse()
          .map((p) => (
            <Card key={p.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.paymentRow}>
                <View>
                  <Text style={styles.amount}>{formatCurrency(p.amount)}</Text>
                  <Text
                    style={{ ...typography.caption, color: colors.textMuted }}
                  >
                    {new Date(p.date).toLocaleDateString()}
                    {p.note ? ` · ${p.note}` : ""}
                  </Text>
                </View>
                <Text
                  onPress={() => removePayment(loan.id, p.id)}
                  style={styles.deleteLink}
                >
                  Delete
                </Text>
              </View>
            </Card>
          ))
      )}
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text style={{ ...typography.caption, color: colors.textMuted, fontWeight: "600" }}>
          {label}
        </Text>
        <Text
          style={{
            ...typography.h2,
            color: accent ? colors.primary : colors.text,
            marginTop: spacing.xs,
          }}
        >
          {value}
        </Text>
      </Card>
    </View>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: spacing.sm,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ ...typography.caption, color: colors.textMuted, fontWeight: "600" }}>
        {label}
      </Text>
      <Text style={{ ...typography.body, color: colors.text }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  contactName: {
    ...typography.h1,
    color: colors.text,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.text,
    fontSize: 16,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  deleteLink: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: "700",
  },
});
