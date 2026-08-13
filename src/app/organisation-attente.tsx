// Écran d'attente : le compte est connecté mais l'organisation n'est pas
// encore ACTIVE (EN_ATTENTE de validation ou SUSPENDUE par l'équipe).
// Le bouton « Vérifier à nouveau » appelle POST /auth/refresh, qui renvoie
// le statut à jour : dès que l'organisation est activée, la garde du layout
// racine bascule automatiquement vers les onglets.

import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

import { Bouton } from "@/components/ui"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import { logout, rafraichirSession } from "@/lib/auth/auth-store"
import { useAuth } from "@/lib/auth/use-auth"

export default function OrganisationAttenteScreen() {
  const t = useTheme()
  const { user } = useAuth()
  const [verification, setVerification] = useState(false)

  const suspendue = user?.organisationStatut === "SUSPENDUE"

  async function verifier() {
    setVerification(true)
    try {
      await rafraichirSession()
    } finally {
      setVerification(false)
    }
  }

  return (
    <SafeAreaView style={[styles.conteneur, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <View style={styles.entete}>
          <Ionicons
            name={suspendue ? "pause-circle-outline" : "time-outline"}
            size={56}
            color={t.textSecondary}
          />
          <Text style={[styles.titre, { color: t.text }]}>
            {suspendue ? "Organisation suspendue" : "Compte en attente"}
          </Text>
          <Text style={[styles.message, { color: t.textSecondary }]}>
            {suspendue
              ? `L'accès de « ${user?.organisationNom ?? "votre organisation"} » est momentanément suspendu. Contactez l'équipe AgriSmart pour en savoir plus.`
              : `L'inscription de « ${user?.organisationNom ?? "votre organisation"} » est en cours de validation par l'équipe AgriSmart. Vous serez notifié par email dès son activation.`}
          </Text>
        </View>

        <View style={styles.actions}>
          <Bouton
            titre="Vérifier à nouveau"
            onPress={verifier}
            chargement={verification}
          />
          <Bouton
            titre="Se déconnecter"
            variante="secondaire"
            onPress={() => void logout()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  contenu: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  entete: { alignItems: "center", gap: Spacing.md },
  titre: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  message: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  actions: { gap: Spacing.sm },
})
