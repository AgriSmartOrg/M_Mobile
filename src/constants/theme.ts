// Thème AgriSmart : palette, espacements et rayons partagés par tous les
// écrans. Vert = identité agricole de la plateforme (aligné sur le web).

import { Platform } from "react-native"

export const Colors = {
  light: {
    text: "#111827",
    textSecondary: "#6b7280",
    background: "#f9fafb",
    card: "#ffffff",
    border: "#e5e7eb",
    primary: "#16a34a",
    primaryMuted: "#dcfce7",
    danger: "#dc2626",
    dangerMuted: "#fee2e2",
    warning: "#d97706",
    warningMuted: "#fef3c7",
    info: "#2563eb",
    infoMuted: "#dbeafe",
  },
  dark: {
    text: "#f9fafb",
    textSecondary: "#9ca3af",
    background: "#0b0f14",
    card: "#171c23",
    border: "#2a313b",
    primary: "#22c55e",
    primaryMuted: "#14351f",
    danger: "#ef4444",
    dangerMuted: "#3f1d1d",
    warning: "#f59e0b",
    warningMuted: "#3a2c10",
    info: "#3b82f6",
    infoMuted: "#16233f",
  },
} as const

export type ThemeColors = {
  [K in keyof typeof Colors.light]: string
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const

export const FontMono = Platform.select({
  ios: "ui-monospace",
  default: "monospace",
})
