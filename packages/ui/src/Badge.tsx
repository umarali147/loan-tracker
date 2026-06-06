import type { LoanStatus } from "@loan/core";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "./tokens";

export interface BadgeProps {
  status: LoanStatus;
}

const labelByStatus: Record<LoanStatus, string> = {
  active: "Active",
  partial: "Partial",
  settled: "Settled",
  overdue: "Overdue",
};

const colorByStatus: Record<LoanStatus, { fg: string; bg: string }> = {
  active: { fg: colors.statusActive, bg: colors.statusActiveBg },
  partial: { fg: colors.statusPartial, bg: colors.statusPartialBg },
  settled: { fg: colors.statusSettled, bg: colors.statusSettledBg },
  overdue: { fg: colors.statusOverdue, bg: colors.statusOverdueBg },
};

export function Badge({ status }: BadgeProps) {
  const { fg, bg } = colorByStatus[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{labelByStatus[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  text: {
    ...typography.caption,
    fontWeight: "600",
  },
});
