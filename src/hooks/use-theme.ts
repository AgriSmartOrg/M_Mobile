// Hook de thème : renvoie la palette selon le mode clair/sombre du système.

import { Colors, type ThemeColors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"

export function useTheme(): ThemeColors {
  const scheme = useColorScheme()
  return scheme === "dark" ? Colors.dark : Colors.light
}
