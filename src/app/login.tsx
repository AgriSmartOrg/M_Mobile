// Écran de connexion (email + mot de passe).
// Réservé aux comptes clients (ADMIN / AGRICULTEUR) — voir auth-store.

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
import { useAuth } from "@/lib/auth/use-auth"

export default function LoginScreen() {
  const t = useTheme()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  async function seConnecter() {
    if (!email.trim() || !password) {
      setErreur("Veuillez saisir votre email et votre mot de passe.")
      return
    }
    setChargement(true)
    setErreur(null)
    try {
      await login({ email: email.trim(), password })
      // La garde du layout racine redirige automatiquement.
    } catch (e) {
      setErreur(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Connexion impossible. Vérifiez votre réseau.",
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
          <View style={styles.entete}>
            <Text style={[styles.logo, { color: t.primary }]}>AgriSmart</Text>
            <Text style={[styles.sousTitre, { color: t.textSecondary }]}>
              Suivez vos parcelles où que vous soyez
            </Text>
          </View>

          <View style={styles.formulaire}>
            <Champ
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <Champ
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              onSubmitEditing={seConnecter}
            />

            {erreur ? (
              <Text style={[styles.erreur, { color: t.danger }]}>{erreur}</Text>
            ) : null}

            <Bouton
              titre="Se connecter"
              onPress={seConnecter}
              chargement={chargement}
            />

            <Pressable
              onPress={() => router.push("/mot-de-passe-oublie")}
              hitSlop={8}
            >
              <Text style={[styles.lien, { color: t.primary }]}>
                Mot de passe oublié ?
              </Text>
            </Pressable>
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
  logo: { fontSize: 34, fontWeight: "800" },
  sousTitre: { fontSize: 15, textAlign: "center" },
  formulaire: { gap: Spacing.md },
  erreur: { fontSize: 14 },
  lien: { fontSize: 14, fontWeight: "600", textAlign: "center" },
})
