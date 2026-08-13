// Petite bibliothèque de composants UI maison (React Native core uniquement).
// Bouton, champ de saisie, carte, badge, séparateur, états vides/chargement.

import { type ReactNode } from "react"
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native"

import { Radius, Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"

// ─── Bouton ──────────────────────────────────────────────────

interface BoutonProps {
  titre: string
  onPress: () => void
  variante?: "primaire" | "secondaire" | "danger"
  desactive?: boolean
  chargement?: boolean
  style?: ViewStyle
}

export function Bouton({
  titre,
  onPress,
  variante = "primaire",
  desactive = false,
  chargement = false,
  style,
}: BoutonProps) {
  const t = useTheme()
  const fond =
    variante === "primaire"
      ? t.primary
      : variante === "danger"
        ? t.danger
        : t.card
  const texte = variante === "secondaire" ? t.text : "#ffffff"

  return (
    <Pressable
      onPress={onPress}
      disabled={desactive || chargement}
      style={({ pressed }) => [
        styles.bouton,
        {
          backgroundColor: fond,
          borderColor: variante === "secondaire" ? t.border : fond,
          opacity: desactive || chargement ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {chargement ? (
        <ActivityIndicator color={texte} />
      ) : (
        <Text style={[styles.boutonTexte, { color: texte }]}>{titre}</Text>
      )}
    </Pressable>
  )
}

// ─── Champ de saisie ─────────────────────────────────────────

interface ChampProps extends TextInputProps {
  label: string
}

export function Champ({ label, style, ...props }: ChampProps) {
  const t = useTheme()
  return (
    <View style={{ gap: Spacing.xs }}>
      <Text style={[styles.label, { color: t.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={t.textSecondary}
        style={[
          styles.champ,
          {
            backgroundColor: t.card,
            borderColor: t.border,
            color: t.text,
          },
          style,
        ]}
        {...props}
      />
    </View>
  )
}

// ─── Carte ───────────────────────────────────────────────────

export function Carte({
  children,
  style,
}: {
  children: ReactNode
  style?: ViewStyle
}) {
  const t = useTheme()
  return (
    <View
      style={[
        styles.carte,
        { backgroundColor: t.card, borderColor: t.border },
        style,
      ]}
    >
      {children}
    </View>
  )
}

// ─── Badge ───────────────────────────────────────────────────

interface BadgeProps {
  texte: string
  ton?: "primaire" | "danger" | "warning" | "info" | "neutre"
}

export function Badge({ texte, ton = "neutre" }: BadgeProps) {
  const t = useTheme()
  const map = {
    primaire: { fond: t.primaryMuted, texte: t.primary },
    danger: { fond: t.dangerMuted, texte: t.danger },
    warning: { fond: t.warningMuted, texte: t.warning },
    info: { fond: t.infoMuted, texte: t.info },
    neutre: { fond: t.border, texte: t.textSecondary },
  } as const
  const c = map[ton]
  return (
    <View style={[styles.badge, { backgroundColor: c.fond }]}>
      <Text style={[styles.badgeTexte, { color: c.texte }]}>{texte}</Text>
    </View>
  )
}

// ─── États ───────────────────────────────────────────────────

export function Chargement() {
  const t = useTheme()
  return (
    <View style={styles.centre}>
      <ActivityIndicator size="large" color={t.primary} />
    </View>
  )
}

export function EtatVide({ message }: { message: string }) {
  const t = useTheme()
  return (
    <View style={styles.centre}>
      <Text style={{ color: t.textSecondary, textAlign: "center" }}>
        {message}
      </Text>
    </View>
  )
}

// ─── Ligne libellé / valeur ──────────────────────────────────

export function Ligne({
  libelle,
  valeur,
}: {
  libelle: string
  valeur: string
}) {
  const t = useTheme()
  return (
    <View style={styles.ligne}>
      <Text style={{ color: t.textSecondary }}>{libelle}</Text>
      <Text style={{ color: t.text, fontWeight: "500", flexShrink: 1 }}>
        {valeur}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bouton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  boutonTexte: {
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
  champ: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  carte: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeTexte: {
    fontSize: 12,
    fontWeight: "600",
  },
  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  ligne: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingVertical: 2,
  },
})
