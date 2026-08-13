// Actionneurs : liste par dispositif, commande ON/OFF, mode auto.
// Copie adaptée de m_frontend/lib/actionneurs.

import { apiFetch } from "./api"

export type TypeActionneur =
  | "POMPE_IRRIGATION"
  | "VENTILATEUR"
  | "ECLAIRAGE"
  | "VANNE_EAU"

export const TYPE_ACTIONNEUR_LABELS: Record<TypeActionneur, string> = {
  POMPE_IRRIGATION: "Pompe d'irrigation",
  VENTILATEUR: "Ventilateur",
  ECLAIRAGE: "Éclairage",
  VANNE_EAU: "Vanne d'eau",
}

export interface Actionneur {
  id: number
  nom: string
  type: TypeActionneur
  etatActuel: boolean
  estActif: boolean
  modeAuto: boolean
  dernireActivation: string | null
  dispositifId: number
  dispositifNom: string
  parcelleId: number
  parcelleNom: string
  dateExtinctionAuto: string | null
  dateExtinction: string | null
}

export interface CommandeRequest {
  etatDemande: boolean
  utilisateurId: number
  dateExtinctionAuto?: string
}

// GET /api/actionneurs/dispositif/{id}
export function getActionneursByDispositif(
  dispositifId: number,
): Promise<Actionneur[]> {
  return apiFetch<Actionneur[]>(`/actionneurs/dispositif/${dispositifId}`)
}

// GET /api/actionneurs/parcelle/{id} — tous les actionneurs actifs de la
// parcelle (accessible ADMIN et AGRICULTEUR assigné).
export function getActionneursByParcelle(
  parcelleId: number,
): Promise<Actionneur[]> {
  return apiFetch<Actionneur[]>(`/actionneurs/parcelle/${parcelleId}`)
}

// POST /api/actionneurs/{id}/commande — 202 Accepted, l'état réel est
// confirmé par l'ACK MQTT (relire l'actionneur quelques secondes après).
export function envoyerCommande(
  id: number,
  data: CommandeRequest,
): Promise<void> {
  return apiFetch<void>(`/actionneurs/${id}/commande`, {
    method: "POST",
    body: data,
  })
}

// PATCH /api/actionneurs/{id}/mode-auto
export function changerModeAuto(
  id: number,
  modeAuto: boolean,
): Promise<Actionneur> {
  return apiFetch<Actionneur>(`/actionneurs/${id}/mode-auto`, {
    method: "PATCH",
    body: { modeAuto },
  })
}
