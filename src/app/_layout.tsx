// Layout racine : garde d'authentification à quatre états.
//  - non connecté                 → écrans login / mot de passe oublié ;
//  - connecté, 1re connexion      → changement de mot de passe obligatoire ;
//  - connecté, organisation non active → écran d'attente ;
//  - connecté                     → onglets de l'application.
// Session persistante : on se connecte une fois ; le JWT court est renouvelé
// automatiquement via un jeton de rafraîchissement longue durée (90 jours).

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import { AppState, useColorScheme } from "react-native"

import { onSessionExpiree } from "@/lib/api"
import { rafraichirSession } from "@/lib/auth/auth-store"
import { useAuth } from "@/lib/auth/use-auth"

SplashScreen.preventAutoHideAsync()

// Le token JWT expire au bout de 20 minutes : on le renouvelle toutes les
// 10 minutes tant que l'application est ouverte, et à chaque retour au
// premier plan (l'intervalle JS étant suspendu en arrière-plan).
const INTERVALLE_REFRESH_MS = 10 * 60 * 1000

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const { user, isLoading, isAuthenticated } = useAuth()

  // JWT expiré (401 sur une requête) : renouvellement via le jeton de
  // rafraîchissement longue durée. La déconnexion n'a lieu que si ce jeton
  // est lui-même expiré/révoqué (géré dans rafraichirSession).
  useEffect(() => {
    return onSessionExpiree(() => {
      void rafraichirSession()
    })
  }, [])

  // Sliding session : renouvellement périodique + au retour au premier plan.
  useEffect(() => {
    if (!isAuthenticated) return
    const intervalle = setInterval(() => {
      void rafraichirSession()
    }, INTERVALLE_REFRESH_MS)
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") void rafraichirSession()
    })
    return () => {
      clearInterval(intervalle)
      abonnement.remove()
    }
  }, [isAuthenticated])

  // Garder le splash tant que SecureStore n'a pas été relu.
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync()
    }
  }, [isLoading])

  if (isLoading) return null

  const doitChangerMdp = isAuthenticated && user?.premiereConnexion === true
  const organisationInactive =
    isAuthenticated &&
    !doitChangerMdp &&
    user?.organisationStatut != null &&
    user.organisationStatut !== "ACTIVE"

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
          <Stack.Screen name="mot-de-passe-oublie" />
        </Stack.Protected>

        <Stack.Protected guard={doitChangerMdp}>
          <Stack.Screen name="changer-mot-de-passe" />
        </Stack.Protected>

        <Stack.Protected guard={organisationInactive}>
          <Stack.Screen name="organisation-attente" />
        </Stack.Protected>

        <Stack.Protected
          guard={isAuthenticated && !doitChangerMdp && !organisationInactive}
        >
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  )
}
