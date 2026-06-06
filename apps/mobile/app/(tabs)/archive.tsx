import { formatCurrency, useLoanStore } from "@loan/core";
import { Badge, Card, colors, spacing, typography } from "@loan/ui";
import { Link } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ArchiveScreen() {
  const loans = useLoanStore((s) => s.loans);
  const settled = useMemo(
    () =>
      loans
        .filter((l) => l.status === "settled")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [loans]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      {settled.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textMuted, textAlign: "center" }}>
            No settled loans yet. Loans move here once their remaining balance
            reaches 0.
          </Text>
        </Card>
      ) : (
        settled.map((loan) => (
          <Link key={loan.id} href={`/loans/${loan.id}`} asChild>
            <Pressable style={{ marginBottom: spacing.sm }}>
              <Card>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.header}>
                      <Text style={styles.contact}>{loan.contactName}</Text>
                      <Badge status={loan.status} />
                    </View>
                    <Text style={styles.sub}>
                      Settled · {new Date(loan.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.amount}>
                    {formatCurrency(loan.principalAmount)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          </Link>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  contact: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  sub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
});
