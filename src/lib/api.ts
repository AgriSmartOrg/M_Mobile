// Client HTTP minimal pour parler à l'API Spring Boot.
//
// - Préfixe automatiquement les requêtes avec l'URL de base de l'API.
// - Ajoute l'en-tête Authorization: Bearer <token> si un token est présent
//   (token gardé en mémoire par le store d'auth — pas de lecture SecureStore
//   à chaque requête, l'API de SecureStore étant asynchrone).
// - Normalise la gestion d'erreurs via la classe ApiError.

import { API_BASE_URL, API_PREFIX } from "./config"

// Token JWT courant, poussé par le store d'authentification.
let tokenCourant: string | null = null

export function setTokenCourant(token: string | null) {
  tokenCourant = token
}

// Écouteurs de session expirée (401 sur une requête authentifiée).
// Le layout racine s'abonne pour déconnecter et rediriger vers /login.
const ecouteursSessionExpiree = new Set<() => void>()

export function onSessionExpiree(listener: () => void): () => void {
  ecouteursSessionExpiree.add(listener)
  return () => ecouteursSessionExpiree.delete(listener)
}

function signalerSessionExpiree() {
  for (const listener of ecouteursSessionExpiree) listener()
}

// Erreur applicative renvoyée par l'API. On y conserve le code HTTP et,
// si disponible, le message renvoyé par le backend (GlobalExceptionHandler).
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  // Corps JSON ; sérialisé automatiquement.
  body?: unknown
  // Joindre le token JWT (vrai par défaut). Mettre à false pour les routes publiques.
  auth?: boolean
}

// Extrait un message d'erreur lisible à partir du corps de la réponse.
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.clone().json()
    if (typeof data?.message === "string") return data.message
    if (data?.erreurs && typeof data.erreurs === "object") {
      const premier = Object.values(data.erreurs)[0]
      if (typeof premier === "string") return premier
    }
  } catch {
    // Corps non JSON : message générique plus bas.
  }
  if (response.status === 401) return "Email ou mot de passe incorrect"
  return "Une erreur est survenue. Veuillez réessayer."
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options

  // Le corps peut être du FormData (upload de photo) : on laisse alors le
  // runtime définir le Content-Type multipart, sans sérialisation JSON.
  const estFormData =
    typeof FormData !== "undefined" && body instanceof FormData

  const finalHeaders = new Headers(headers)
  if (body !== undefined && !estFormData) {
    finalHeaders.set("Content-Type", "application/json")
  }

  if (auth && tokenCourant) {
    finalHeaders.set("Authorization", `Bearer ${tokenCourant}`)
  }

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : estFormData
          ? (body as FormData)
          : JSON.stringify(body),
  })

  if (!response.ok) {
    // 401 sur une requête authentifiée = token absent/expiré/invalide.
    // Le login utilise auth=false : un 401 d'identifiants incorrects ne
    // déclenche donc PAS la déconnexion globale.
    if (response.status === 401 && auth) {
      signalerSessionExpiree()
    }
    throw new ApiError(await extractErrorMessage(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
