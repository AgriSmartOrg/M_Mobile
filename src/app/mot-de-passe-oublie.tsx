// Réinitialisation du mot de passe en deux étapes :
//  1. saisie de l'email → le backend envoie un code (valable 30 minutes) ;
//  2. saisie du code + nouveau mot de passe.
// La réponse de l'étape 1 est identique que l'email existe ou non
// (anti-énumération) : le message affiché reste donc générique.

import { router } from "expo-router"
import { useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import {
  demanderCodeReinitialisation,
  reinitialiserMotDePasse,
} from "@/lib/auth/auth-service"

export default function MotDePasseOublieScreen() {
  const t = useTheme()

  const [etape, setEtape] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [nouveau, setNouveau] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [erreur, setErreur] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  async function envoyerCode() {
    if (!email.trim()) {
      setErreur("Veuillez saisir votre email.")
      return
    }
    setChargement(true)
    setErreur(null)
    setInfo(null)
    try {
      await demanderCodeReinitialisation(email.trim())
      setInfo("Si un compte existe pour cet email, un code vient d'être envoyé.")
      setEtape("code")
    } catch (e) {
      setErreur(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Envoi impossible. Vérifiez votre réseau.",
      )
    } finally {
      setChargement(false)
    }
  }

  async function reinitialiser() {
    if (!code.trim()) {
      setErreur("Veuillez saisir le code reçu par email.")
      return
    }
    if (nouveau.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (nouveau !== confirmation) {
      setErreur("La confirmation ne correspond pas au nouveau mot de passe.")
      return
    }
    setChargement(true)
    setErreur(null)
    try {
      await reinitialiserMotDePasse({
        email: email.trim(),
        code: code.trim(),
        nouveauMotDePasse: nouveau,
      })
      // Retour à l'écran de connexion, prêt pour le nouveau mot de passe.
      router.back()
    } catch (e) {
      setErreur(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Réinitialisation impossible. Veuillez réessayer.",
      )
    } finally {
      setChargement(false)
    }
  }

  const etapeEmail = etape === "email"

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
          <View style={styles.entete}>
            <Text style={[styles.titre, { color: t.text }]}>
              {etapeEmail ? "Mot de passe oublié" : "Vérifiez vos emails"}
            </Text>
            <Text style={[styles.sousTitre, { color: t.textSecondary }]}>
              {etapeEmail
                ? "Saisissez votre email : nous vous enverrons un code de réinitialisation valable 30 minutes."
                : `Saisissez le code reçu à ${email.trim()} puis choisissez un nouveau mot de passe.`}
            </Text>
          </View>

          <View style={styles.formulaire}>
            {etapeEmail ? (
              <Champ
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onSubmitEditing={envoyerCode}
              />
            ) : (
              <>
                <Champ
                  label="Code de vérification"
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Champ
                  label="Nouveau mot de passe"
                  value={nouveau}
                  onChangeText={setNouveau}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="new-password"
                />
                <Champ
                  label="Confirmer le nouveau mot de passe"
                  value={confirmation}
                  onChangeText={setConfirmation}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="new-password"
                  onSubmitEditing={reinitialiser}
                />
              </>
            )}

            {erreur ? (
              <Text style={[styles.message, { color: t.danger }]}>
                {erreur}
              </Text>
            ) : null}
            {info && !erreur ? (
              <Text style={[styles.message, { color: t.textSecondary }]}>
                {info}
              </Text>
            ) : null}

            <Bouton
              titre={etapeEmail ? "Envoyer le code" : "Réinitialiser"}
              onPress={etapeEmail ? envoyerCode : reinitialiser}
              chargement={chargement}
            />

            {etapeEmail ? (
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Text style={[styles.lien, { color: t.primary }]}>
                  Retour à la connexion
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setEtape("email")} hitSlop={8}>
                <Text style={[styles.lien, { color: t.primary }]}>
                  Code non reçu ? Renvoyer un code
                </Text>
              </Pressable>
            )}
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
    gap: Spacing.xl,
  },
  entete: { alignItems: "center", gap: Spacing.sm },
  titre: { fontSize: 24, fontWeight: "800" },
  sousTitre: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  formulaire: { gap: Spacing.md },
  message: { fontSize: 14 },
  lien: { fontSize: 14, fontWeight: "600", textAlign: "center" },
})
