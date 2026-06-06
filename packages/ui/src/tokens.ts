export const colors = {
  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",

  primary: "#0d9488",
  primaryText: "#ffffff",
  primaryMuted: "#ccfbf1",

  secondary: "#e2e8f0",
  secondaryText: "#0f172a",

  danger: "#b45309",
  dangerMuted: "#fef3c7",

  positive: "#0d9488",
  negative: "#b45309",

  statusActive: "#0ea5e9",
  statusActiveBg: "#e0f2fe",
  statusPartial: "#9333ea",
  statusPartialBg: "#f3e8ff",
  statusSettled: "#475569",
  statusSettledBg: "#e2e8f0",
  statusOverdue: "#b45309",
  statusOverdueBg: "#fef3c7",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  caption: { fontSize: 12, lineHeight: 16 },
  body: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: "700" as const },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: "700" as const },
} as const;
