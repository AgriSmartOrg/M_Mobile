// Appels à l'API d'authentification.

import { apiFetch } from "../api"
import type {
  AuthResponse,
  ChangerMotDePasseRequest,
  LoginRequest,
} from "./types"

// POST /api/auth/login — route publique (pas de token à joindre).
export function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: credentials,
    auth: false,
  })
}

// POST /api/auth/mot-de-passe-oublie/demander-code — étape 1 (public).
// Répond toujours 204, que l'email existe ou non (anti-énumération).
export function demanderCodeReinitialisation(email: string): Promise<void> {
  return apiFetch<void>("/auth/mot-de-passe-oublie/demander-code", {
    method: "POST",
    body: { email },
    auth: false,
  })
}

// POST /api/auth/mot-de-passe-oublie/reinitialiser — étape 2 (public).
export function reinitialiserMotDePasse(payload: {
  email: string
  code: string
  nouveauMotDePasse: string
}): Promise<void> {
  return apiFetch<void>("/auth/mot-de-passe-oublie/reinitialiser", {
    method: "POST",
    body: payload,
    auth: false,
  })
}

// POST /api/auth/refresh — renouvelle le JWT à partir du jeton de
// rafraîchissement longue durée (public : le JWT peut être expiré).
// Renvoie aussi les informations à jour de l'utilisateur et un nouveau
// jeton de rafraîchissement (rotation).
export function refresh(refreshToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  })
}

// POST /api/auth/changer-mot-de-passe — nécessite d'être connecté.
export function changerMotDePasse(
  request: ChangerMotDePasseRequest,
): Promise<void> {
  return apiFetch<void>("/auth/changer-mot-de-passe", {
    method: "POST",
    body: request,
  })
}
