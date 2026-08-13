// Types liés à l'authentification, alignés sur les DTO du backend Spring Boot.
// (Copie adaptée de m_frontend/lib/auth/types.ts.)

// Rôles utilisateur (enum RoleEnum côté backend).
// L'application mobile est destinée aux clients : ADMIN / AGRICULTEUR.
export type Role = "SUPERVISEUR" | "TECHNICIEN" | "ADMIN" | "AGRICULTEUR"

// Statut de l'organisation (StatutOrganisationEnum côté backend).
export type StatutOrganisation = "EN_ATTENTE" | "ACTIVE" | "SUSPENDUE"

// Corps de la requête de connexion (LoginRequest côté backend).
export interface LoginRequest {
  email: string
  password: string
}

// Corps de la requête de changement de mot de passe.
export interface ChangerMotDePasseRequest {
  ancienMotDePasse: string
  nouveauMotDePasse: string
}

// Réponse renvoyée par POST /api/auth/login (AuthResponse côté backend).
export interface AuthResponse {
  token: string
  // Jeton de rafraîchissement longue durée (90 jours, rotation à chaque
  // utilisation) : permet de renouveler le JWT sans se reconnecter.
  refreshToken: string
  utilisateurId: number
  nom: string
  prenom: string
  email: string
  role: Role
  photoUrl: string | null
  premiereConnexion: boolean
  emailVerifie: boolean
  organisationId: number | null
  organisationNom: string | null
  organisationStatut: StatutOrganisation | null
}

// Utilisateur connecté tel que conservé côté client (la réponse sans le token).
export interface AuthUser {
  utilisateurId: number
  nom: string
  prenom: string
  email: string
  role: Role
  photoUrl: string | null
  premiereConnexion: boolean
  emailVerifie: boolean
  organisationId: number | null
  organisationNom: string | null
  organisationStatut: StatutOrganisation | null
}

// Rôles clients (seuls autorisés sur l'application mobile).
export const ROLES_CLIENT: Role[] = ["ADMIN", "AGRICULTEUR"]
