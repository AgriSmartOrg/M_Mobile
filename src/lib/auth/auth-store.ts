// Store d'authentification externe (hors React), persisté dans SecureStore.
//
// Exposé à React via useSyncExternalStore (voir use-auth.ts). SecureStore
// étant asynchrone, l'hydratation initiale se fait en tâche de fond : le
// layout racine attend `hydrated` avant de décider d'une redirection.
// (Adaptation mobile de m_frontend/lib/auth/auth-store.ts.)

import { ApiError, setTokenCourant } from "../api"
import {
  login as loginRequest,
  refresh as refreshRequest,
} from "./auth-service"
import {
  clearAuth,
  getRefreshToken,
  getStoredUser,
  getToken,
  setRefreshToken,
  setStoredUser,
  setToken,
} from "./storage"
import type { AuthResponse, AuthUser, LoginRequest } from "./types"
import { ROLES_CLIENT } from "./types"

export interface AuthState {
  user: AuthUser | null
  // false tant que SecureStore n'a pas été lu au démarrage.
  hydrated: boolean
}

let state: AuthState = { user: null, hydrated: false }
let hydratationLancee = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setState(next: AuthState) {
  state = next
  emit()
}

// Persiste une réponse d'authentification complète (JWT + jeton de
// rafraîchissement + utilisateur) et met à jour le store en mémoire.
async function appliquerSession(response: AuthResponse): Promise<AuthUser> {
  const { token, refreshToken, ...user } = response
  setTokenCourant(token)
  await Promise.all([
    setToken(token),
    setRefreshToken(refreshToken),
    setStoredUser(user),
  ])
  setState({ user, hydrated: true })
  return user
}

// Hydratation initiale : relit le token + l'utilisateur persistés.
// La session est considérée valide immédiatement (pas d'écran de connexion),
// puis le JWT est renouvelé en arrière-plan via le jeton longue durée :
// l'utilisateur ne se reconnecte que si ce jeton est expiré/révoqué (90 j).
// Idempotente ; lancée au premier abonnement (montage du layout racine).
export function hydrater(): void {
  if (hydratationLancee) return
  hydratationLancee = true

  void (async () => {
    const [token, user] = await Promise.all([getToken(), getStoredUser()])
    if (token && user) {
      setTokenCourant(token)
      setState({ user, hydrated: true })
      // JWT probablement expiré après une longue fermeture : renouvellement
      // silencieux dès le démarrage.
      void rafraichirSession()
    } else {
      setState({ user: null, hydrated: true })
    }
  })()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  hydrater()
  return () => listeners.delete(listener)
}

export function getSnapshot(): AuthState {
  return state
}

// Connexion : appelle l'API, persiste les jetons + l'utilisateur, met à jour
// le store. L'application mobile est réservée aux rôles clients.
export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await loginRequest(credentials)

  if (!ROLES_CLIENT.includes(response.role)) {
    throw new Error(
      "Cette application est réservée aux comptes clients " +
        "(administrateur ou agriculteur).",
    )
  }

  return appliquerSession(response)
}

// Déconnexion : purge SecureStore et le store en mémoire.
export async function logout(): Promise<void> {
  setTokenCourant(null)
  await clearAuth()
  setState({ user: null, hydrated: true })
}

// Lève le drapeau « première connexion » après un changement de mot de passe.
export function marquerMotDePasseChange(): void {
  if (!state.user) return
  const user: AuthUser = { ...state.user, premiereConnexion: false }
  void setStoredUser(user)
  setState({ user, hydrated: true })
}

// Met à jour partiellement l'utilisateur courant (après édition du profil :
// nom, prénom, photo) et persiste la copie locale.
export function mettreAJourUtilisateur(patch: Partial<AuthUser>): void {
  if (!state.user) return
  const user: AuthUser = { ...state.user, ...patch }
  void setStoredUser(user)
  setState({ user, hydrated: true })
}

// Renouvelle le JWT à partir du jeton de rafraîchissement longue durée et
// rafraîchit les informations de l'utilisateur (statut d'organisation compris).
// Rejette si le jeton est expiré/révoqué (reconnexion nécessaire) ; silencieux
// sur les erreurs réseau (le JWT courant reste utilisé).
// Une seule exécution à la fois : les appels concurrents partagent la promesse.
let refreshEnCours: Promise<boolean> | null = null

export function rafraichirSession(): Promise<boolean> {
  if (refreshEnCours) return refreshEnCours
  refreshEnCours = (async () => {
    if (!state.user) return false
    const jeton = await getRefreshToken()
    if (!jeton) return false
    try {
      const response = await refreshRequest(jeton)
      await appliquerSession(response)
      return true
    } catch (e) {
      // 401 = jeton expiré/révoqué côté serveur : session définitivement
      // perdue. Toute autre erreur (réseau) est temporaire : on garde tout.
      if (e instanceof ApiError && e.status === 401) {
        await logout()
      }
      return false
    } finally {
      refreshEnCours = null
    }
  })()
  return refreshEnCours
}
