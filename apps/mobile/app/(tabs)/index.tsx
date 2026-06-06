import {
  type Loan,
  compareLoansByDueDate,
  computeDashboardSummary,
  computeRemainingBalance,
  formatCurrency,
  useLoanStore,
} from "@loan/core";
import { Badge, Card, colors, radius, spacing, typography } from "@loan/ui";
import { Link } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DashboardScreen() {
  const loans = useLoanStore((s) => s.loans);
  const paymentsByLoan = useLoanStore((s) => s.paymentsByLoan);

  const summary = useMemo(
    () => computeDashboardSummary(loans, paymentsByLoan),
    [loans, paymentsByLoan]
  );

  const activeLoans = useMemo(
    () =>
      loans
        .filter((l) => l.status !== "settled")
        .sort(compareLoansByDueDate),
    [loans]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }}>
        <View style={styles.row}>
          <SummaryCard
            label="Lent out"
            amount={summary.totalLent}
            tone="positive"
          />
          <SummaryCard
            label="Owed"
            amount={summary.totalOwed}
            tone="negative"
          />
        </View>
        <View style={{ height: spacing.sm }} />
        <Card>
          <Text style={styles.netLabel}>Net position</Text>
          <Text
            style={[
              styles.netAmount,
              {
                color:
                  summary.netPosition >= 0
                    ? colors.positive
                    : colors.negative,
              },
            ]}
          >
            {summary.netPosition > 0 ? "+" : ""}
            {formatCurrency(summary.netPosition)}
          </Text>
        </Card>

        {summary.overdueCount > 0 && (
          <View style={styles.overdueBanner}>
            <Text style={styles.overdueText}>
              {summary.overdueCount} loan
              {summary.overdueCount === 1 ? "" : "s"} overdue
            </Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>Active loans</Text>
        {activeLoans.length === 0 ? (
          <Card>
            <Text style={{ color: colors.textMuted, textAlign: "center" }}>
              No active loans yet. Tap + to log one.
            </Text>
          </Card>
        ) : (
          activeLoans.map((loan) => (
            <LoanRow
              key={loan.id}
              loan={loan}
              remaining={computeRemainingBalance(
                loan,
                paymentsByLoan[loan.id] ?? []
              )}
            />
          ))
        )}
      </ScrollView>

      <Link href="/loans/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function SummaryCard({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "positive" | "negative";
}) {
  const color = tone === "positive" ? colors.positive : colors.negative;
  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text style={styles.netLabel}>{label}</Text>
        <Text style={[styles.summaryAmount, { color }]}>
          {formatCurrency(amount)}
        </Text>
      </Card>
    </View>
  );
}

function LoanRow({ loan, remaining }: { loan: Loan; remaining: number }) {
  return (
    <Link href={`/loans/${loan.id}`} asChild>
      <Pressable style={{ marginBottom: spacing.sm }}>
        <Card>
          <View style={styles.loanRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.loanRowHeader}>
                <Text style={styles.contactName}>{loan.contactName}</Text>
                <Badge status={loan.status} />
              </View>
              <Text
                style={{
                  ...typography.caption,
                  color:
                    loan.direction === "lent"
                      ? colors.positive
                      : colors.negative,
                  marginTop: 2,
                  fontWeight: "600",
                }}
              >
                {loan.direction === "lent" ? "Lent" : "Borrowed"}
                {loan.dateDue
                  ? ` · Due ${new Date(loan.dateDue).toLocaleDateString()}`
                  : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.amount}>{formatCurrency(remaining)}</Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                of {formatCurrency(loan.principalAmount)}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  netLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  netAmount: {
    ...typography.h1,
    marginTop: spacing.xs,
  },
  summaryAmount: {
    ...typography.h2,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  loanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  loanRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  contactName: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  amount: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  overdueBanner: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.statusOverdueBg,
  },
  overdueText: {
    ...typography.body,
    color: colors.statusOverdue,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: -2,
  },
});
