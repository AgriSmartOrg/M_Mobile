// Onglet « Plus » : profil de l'utilisateur, accès aux tickets, déconnexion.

import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { Badge, Carte, Ligne } from "@/components/ui"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import { useAuth } from "@/lib/auth/use-auth"

export default function PlusScreen() {
  const t = useTheme()
  const router = useRouter()
  const { user, logout } = useAuth()

  function confirmerDeconnexion() {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: () => {
          void logout()
        },
      },
    ])
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.contenu}
    >
      {/* ── Profil ── */}
      <Carte>
        <View style={styles.profil}>
          {user?.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[styles.avatar, { backgroundColor: t.primaryMuted }]}
            >
              <Text style={[styles.initiales, { color: t.primary }]}>
                {(user?.prenom?.[0] ?? "") + (user?.nom?.[0] ?? "")}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.nom, { color: t.text }]}>
              {user?.prenom} {user?.nom}
            </Text>
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>
              {user?.email}
            </Text>
          </View>
          <Badge
            texte={user?.role === "ADMIN" ? "Administrateur" : "Agriculteur"}
            ton="primaire"
          />
        </View>
        {user?.organisationNom ? (
          <Ligne libelle="Organisation" valeur={user.organisationNom} />
        ) : null}
      </Carte>

      {/* ── Liens ── */}
      <Carte style={{ gap: 0 }}>
        <Pressable
          style={styles.lien}
          onPress={() => router.navigate("/(tabs)/plus/profil")}
        >
          <Ionicons name="person-circle-outline" size={22} color={t.primary} />
          <Text style={[styles.lienTexte, { color: t.text }]}>
            Mon profil
          </Text>
          <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
        </Pressable>
        <Pressable
          style={styles.lien}
          onPress={() => router.navigate("/(tabs)/plus/tickets")}
        >
          <Ionicons name="help-buoy-outline" size={22} color={t.primary} />
          <Text style={[styles.lienTexte, { color: t.text }]}>
            Tickets de support
          </Text>
          <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
        </Pressable>
      </Carte>

      {/* ── Déconnexion ── */}
      <Carte style={{ gap: 0 }}>
        <Pressable style={styles.lien} onPress={confirmerDeconnexion}>
          <Ionicons name="log-out-outline" size={22} color={t.danger} />
          <Text style={[styles.lienTexte, { color: t.danger }]}>
            Se déconnecter
          </Text>
        </Pressable>
      </Carte>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.md, gap: Spacing.md },
  profil: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  initiales: { fontSize: 18, fontWeight: "700" },
  nom: { fontSize: 17, fontWeight: "700" },
  lien: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  lienTexte: { flex: 1, fontSize: 15, fontWeight: "500" },
})
