// Persistance du token JWT et de l'utilisateur connecté.
// SecureStore chiffre les valeurs (Keystore Android / Keychain iOS).

import * as SecureStore from "expo-secure-store"

import type { AuthUser } from "./types"

const TOKEN_KEY = "agrismart_token"
const REFRESH_KEY = "agrismart_refresh_token"
const USER_KEY = "agrismart_user"

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  } catch {
    // Stockage indisponible : la session ne survivra pas au redémarrage.
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY)
  } catch {
    return null
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_KEY, token)
  } catch {
    // Voir setToken.
  }
}

export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const brut = await SecureStore.getItemAsync(USER_KEY)
    return brut ? (JSON.parse(brut) as AuthUser) : null
  } catch {
    return null
  }
}

export async function setStoredUser(user: AuthUser): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
  } catch {
    // Voir setToken.
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
    await SecureStore.deleteItemAsync(USER_KEY)
  } catch {
    // Rien à faire : au pire les clés n'existaient pas.
  }
}
