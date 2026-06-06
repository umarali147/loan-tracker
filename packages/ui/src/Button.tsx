import React from "react";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "./tokens";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: ButtonProps) {
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.danger
        : colors.secondary;
  const fg =
    variant === "secondary" ? colors.secondaryText : colors.primaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  label: {
    ...typography.label,
  },
});
