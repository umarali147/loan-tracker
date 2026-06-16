export const colors = {
  background: "#f9fafb", // gray-50
  surface: "#ffffff",
  border: "#e5e7eb", // gray-200
  text: "#111827", // gray-900
  textMuted: "#6b7280", // gray-500

  primary: "#059669", // emerald-600
  primaryText: "#ffffff",
  primaryMuted: "#d1fae5", // emerald-100

  secondary: "#f3f4f6", // gray-100
  secondaryText: "#111827",

  danger: "#e11d48", // rose-600
  dangerMuted: "#ffe4e6", // rose-100

  positive: "#059669", // emerald-600
  negative: "#e11d48", // rose-600

  statusActive: "#047857", // emerald-700
  statusActiveBg: "#ecfdf5", // emerald-50
  statusPartial: "#b45309", // amber-700
  statusPartialBg: "#fffbeb", // amber-50
  statusSettled: "#4b5563", // gray-600
  statusSettledBg: "#f3f4f6", // gray-100
  statusOverdue: "#be123c", // rose-700
  statusOverdueBg: "#fff1f2", // rose-50
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
  xl: 20,
  pill: 999,
} as const;

/** Inter font family names as registered by expo-google-fonts/useFonts. */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const typography = {
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
    fontFamily: fonts.semibold,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700" as const,
    fontFamily: fonts.bold,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    fontFamily: fonts.bold,
  },
} as const;
