import {
  computeLoanSummary,
  formatCurrency,
  type LoanEvent,
  type Payment,
  useLoanStore,
} from "@loan/core";

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_EVENTS: LoanEvent[] = [];
import { Badge, Button, Card, colors, radius, spacing, typography } from "@loan/ui";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Banknote, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PaymentForm } from "../../../src/components/PaymentForm";

type TimelineItem =
  | { id: string; ts: string; type: "payment"; payment: Payment }
  | { id: string; ts: string; type: "event"; event: LoanEvent };

export default function LoanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const loan = useLoanStore((s) => s.loans.find((l) => l.id === id));
  const paymentsRaw = useLoanStore((s) => s.paymentsByLoan[id ?? ""]);
  const payments = paymentsRaw ?? EMPTY_PAYMENTS;
  const eventsRaw = useLoanStore((s) => s.eventsByLoan[id ?? ""]);
  const events = eventsRaw ?? EMPTY_EVENTS;
  const removeLoan = useLoanStore((s) => s.removeLoan);
  const removePayment = useLoanStore((s) => s.removePayment);

  const timeline = useMemo<TimelineItem[]>(
    () =>
      [
        ...payments.map(
          (p): TimelineItem => ({
            id: `p_${p.id}`,
            ts: p.createdAt || p.date,
            type: "payment",
            payment: p,
          })
        ),
        ...events.map(
          (e): TimelineItem => ({
            id: `e_${e.id}`,
            ts: e.createdAt,
            type: "event",
            event: e,
          })
        ),
      ].sort((a, b) => b.ts.localeCompare(a.ts)),
    [payments, events]
  );

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
        <Stat label="Principal" value={formatCurrency(loan.principalAmount, loan.currency)} />
        <Stat label="Paid" value={formatCurrency(summary.totalPaid, loan.currency)} />
        <Stat
          label="Remaining"
          value={formatCurrency(summary.remainingBalance, loan.currency)}
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

      <Text style={styles.sectionHeader}>Settle up</Text>
      {loan.status === "settled" ? (
        <Text style={{ color: colors.textMuted }}>
          This loan is settled. Edit it to raise the principal if needed.
        </Text>
      ) : (
        <PaymentForm loanId={loan.id} />
      )}

      <Text style={styles.sectionHeader}>History</Text>
      {timeline.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>No activity yet.</Text>
      ) : (
        timeline.map((item) =>
          item.type === "payment" ? (
            <Card key={item.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.histRow}>
                <View style={[styles.histIcon, { backgroundColor: colors.primaryMuted }]}>
                  <Banknote size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.amount}>
                    Payment · {formatCurrency(item.payment.amount, loan.currency)}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {new Date(item.payment.date).toLocaleDateString()}
                    {item.payment.note ? ` · ${item.payment.note}` : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removePayment(loan.id, item.payment.id)}
                  hitSlop={8}
                  style={styles.histDelete}
                >
                  <Trash2 size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            </Card>
          ) : (
            <Card key={item.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.histRow}>
                <View
                  style={[
                    styles.histIcon,
                    {
                      backgroundColor:
                        item.event.kind === "edited"
                          ? colors.statusPartialBg
                          : item.event.kind === "settled"
                            ? colors.primaryMuted
                            : colors.secondary,
                    },
                  ]}
                >
                  {item.event.kind === "created" ? (
                    <Plus size={16} color={colors.textMuted} />
                  ) : item.event.kind === "settled" ? (
                    <CheckCircle2 size={16} color={colors.primary} />
                  ) : (
                    <Pencil size={15} color={colors.statusPartial} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.body, color: colors.text }}>
                    {item.event.message}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {new Date(item.event.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card>
          )
        )
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
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  histIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  histDelete: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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
