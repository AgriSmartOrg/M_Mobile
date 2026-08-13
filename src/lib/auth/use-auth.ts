// Hook d'authentification : expose l'utilisateur connecté et les actions de
// connexion / déconnexion, via useSyncExternalStore (aucun Provider requis).

import { useSyncExternalStore } from "react"

import {
  getSnapshot,
  login,
  logout,
  marquerMotDePasseChange,
  subscribe,
} from "./auth-store"
import type { AuthUser, LoginRequest } from "./types"

interface UseAuthResult {
  user: AuthUser | null
  // true tant que SecureStore n'a pas été relu (évite les redirections hâtives).
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<AuthUser>
  logout: () => Promise<void>
  marquerMotDePasseChange: () => void
}

export function useAuth(): UseAuthResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    user: state.user,
    isLoading: !state.hydrated,
    isAuthenticated: state.user !== null,
    login,
    logout,
    marquerMotDePasseChange,
  }
}
