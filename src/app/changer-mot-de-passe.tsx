// Changement de mot de passe obligatoire à la première connexion
// (comptes créés par un administrateur avec mot de passe provisoire).

import { useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Bouton, Champ } from "@/components/ui"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import { ApiError } from "@/lib/api"
import { changerMotDePasse } from "@/lib/auth/auth-service"
import { useAuth } from "@/lib/auth/use-auth"

export default function ChangerMotDePasseScreen() {
  const t = useTheme()
  const { marquerMotDePasseChange, logout } = useAuth()

  const [ancien, setAncien] = useState("")
  const [nouveau, setNouveau] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  async function valider() {
    if (!ancien || !nouveau || !confirmation) {
      setErreur("Veuillez remplir tous les champs.")
      return
    }
    if (nouveau.length < 8) {
      setErreur("Le nouveau mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (nouveau !== confirmation) {
      setErreur("La confirmation ne correspond pas au nouveau mot de passe.")
      return
    }
    setChargement(true)
    setErreur(null)
    try {
      await changerMotDePasse({
        ancienMotDePasse: ancien,
        nouveauMotDePasse: nouveau,
      })
      marquerMotDePasseChange()
      // La garde du layout racine bascule vers les onglets.
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? e.message
          : "Impossible de changer le mot de passe.",
      )
    } finally {
      setChargement(false)
    }
  }

  return (
    <SafeAreaView style={[styles.conteneur, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: Spacing.sm }}>
            <Text style={[styles.titre, { color: t.text }]}>
              Nouveau mot de passe
            </Text>
            <Text style={{ color: t.textSecondary }}>
              Pour sécuriser votre compte, choisissez un mot de passe personnel
              avant de continuer.
            </Text>
          </View>

          <View style={styles.formulaire}>
            <Champ
              label="Mot de passe actuel"
              value={ancien}
              onChangeText={setAncien}
              secureTextEntry
            />
            <Champ
              label="Nouveau mot de passe"
              value={nouveau}
              onChangeText={setNouveau}
              secureTextEntry
            />
            <Champ
              label="Confirmer le nouveau mot de passe"
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry
              onSubmitEditing={valider}
            />

            {erreur ? (
              <Text style={{ color: t.danger }}>{erreur}</Text>
            ) : null}

            <Bouton
              titre="Changer le mot de passe"
              onPress={valider}
              chargement={chargement}
            />
            <Bouton
              titre="Se déconnecter"
              variante="secondaire"
              onPress={() => {
                void logout()
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  contenu: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  titre: { fontSize: 24, fontWeight: "700" },
  formulaire: { gap: Spacing.md },
})
