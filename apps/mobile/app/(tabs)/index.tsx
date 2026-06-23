import {
  type Loan,
  type MoneyFigure,
  computeDashboardSummary,
  computeRemainingBalance,
  formatCurrency,
  useLoanStore,
} from "@loan/core";
import { Badge, Card, colors, fonts, radius, spacing, typography } from "@loan/ui";
import { Link } from "expo-router";
import { Plus } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

type LoanFilter = "all" | "active" | "archive";
const PREF_CURRENCY_KEY = "preferredCurrency";

/** Format a MoneyFigure: exact native when single-currency, ≈ converted when mixed. */
function figureDisplay(figure: MoneyFigure, preferred: string, sign = false): string {
  const exact = !figure.mixed;
  const value = exact ? figure.nativeAmount ?? figure.amount : figure.amount;
  const currency = exact ? figure.nativeCurrency ?? preferred : preferred;
  const prefix = (figure.mixed ? "≈ " : "") + (sign && value > 0 ? "+" : "");
  return prefix + formatCurrency(value, currency);
}

export default function DashboardScreen() {
  const loans = useLoanStore((s) => s.loans);
  const paymentsByLoan = useLoanStore((s) => s.paymentsByLoan);
  const preferredCurrency = useLoanStore((s) => s.preferredCurrency);
  const setPreferredCurrency = useLoanStore((s) => s.setPreferredCurrency);
  const rates = useLoanStore((s) => s.rates);

  const [filter, setFilter] = useState<LoanFilter>("all");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    SecureStore.getItemAsync(PREF_CURRENCY_KEY).then((v) => {
      if (v) setPreferredCurrency(v);
    });
  }, [setPreferredCurrency]);

  const changeCurrency = (code: string) => {
    setPreferredCurrency(code);
    SecureStore.setItemAsync(PREF_CURRENCY_KEY, code).catch(() => {});
  };

  const summary = useMemo(
    () =>
      computeDashboardSummary(loans, paymentsByLoan, {
        preferredCurrency,
        rates,
      }),
    [loans, paymentsByLoan, preferredCurrency, rates]
  );

  // Newest activity first, so a loan jumps to the top whenever it's updated
  // (e.g. just settled). Settled loans stay visible; filter narrows the view.
  const visibleLoans = useMemo(() => {
    const byRecency = [...loans].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    if (filter === "active") return byRecency.filter((l) => l.status !== "settled");
    if (filter === "archive") return byRecency.filter((l) => l.status === "settled");
    return byRecency;
  }, [loans, filter]);

  // Only offer currencies actually in use (plus the current pick) — compact.
  const currencyOptions = useMemo(
    () => Array.from(new Set([preferredCurrency, ...loans.map((l) => l.currency)])),
    [loans, preferredCurrency]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: 96 + insets.bottom,
          width: "100%",
          maxWidth: 720,
          alignSelf: "center",
        }}
      >
        <Card>
          <View style={styles.overviewHead}>
            <Text style={styles.netLabel}>Net position</Text>
            <View style={styles.curRow}>
              {currencyOptions.map((code) => (
                <Pressable
                  key={code}
                  onPress={() => changeCurrency(code)}
                  style={[
                    styles.curChip,
                    preferredCurrency === code && styles.curChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.curChipText,
                      preferredCurrency === code && styles.curChipTextActive,
                    ]}
                  >
                    {code}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Text
            style={[
              styles.netAmount,
              {
                color:
                  summary.net.amount >= 0 ? colors.positive : colors.negative,
              },
            ]}
          >
            {figureDisplay(summary.net, summary.preferredCurrency, true)}
          </Text>
          {summary.net.mixed && (
            <Text style={styles.convNote}>
              converted from {summary.net.currencies.join(", ")}
            </Text>
          )}
          <View style={styles.overviewDivider} />
          <View style={styles.miniRow}>
            <MiniFigure
              label="Lent out"
              figure={summary.lent}
              preferred={summary.preferredCurrency}
              tone="positive"
            />
            <MiniFigure
              label="Owed"
              figure={summary.owed}
              preferred={summary.preferredCurrency}
              tone="negative"
            />
          </View>
        </Card>

        {summary.overdueCount > 0 && (
          <View style={styles.overdueBanner}>
            <Text style={styles.overdueText}>
              {summary.overdueCount} loan
              {summary.overdueCount === 1 ? "" : "s"} overdue
            </Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>Loans</Text>
        <View style={styles.filterRow}>
          {(["all", "active", "archive"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f && styles.filterChipTextActive,
                ]}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        {visibleLoans.length === 0 ? (
          <Card>
            <Text style={{ color: colors.textMuted, textAlign: "center" }}>
              {filter === "archive"
                ? "No settled loans yet."
                : "No loans yet. Tap + to log one."}
            </Text>
          </Card>
        ) : (
          visibleLoans.map((loan) => (
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
        <Pressable style={[styles.fab, { bottom: spacing.xl + insets.bottom }]}>
          <Plus color="#fff" size={26} strokeWidth={2.5} />
        </Pressable>
      </Link>
    </View>
  );
}

function MiniFigure({
  label,
  figure,
  preferred,
  tone,
}: {
  label: string;
  figure: MoneyFigure;
  preferred: string;
  tone: "positive" | "negative";
}) {
  const color = tone === "positive" ? colors.positive : colors.negative;
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={[styles.miniValue, { color }]} numberOfLines={1}>
        {figureDisplay(figure, preferred)}
      </Text>
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
              <Text style={styles.amount}>
                {formatCurrency(remaining, loan.currency)}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                of {formatCurrency(loan.principalAmount, loan.currency)}
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
  showingLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  curChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  curChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  curChipText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
  },
  curChipTextActive: {
    color: colors.primaryText,
  },
  convNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  overviewHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  curRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.xs,
    flexShrink: 1,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  miniRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  miniValue: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.primaryText,
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
