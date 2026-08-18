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

// Origine d'une commande — voir OrigineCommandeEnum côté backend.
export type OrigineCommande =
  | "MANUELLE"
  | "AUTO_SEUIL"
  | "AUTO_PLUIE"
  | "AUTO_EXTINCTION"

export const ORIGINE_COMMANDE_LABELS: Record<OrigineCommande, string> = {
  MANUELLE: "Manuelle",
  AUTO_SEUIL: "Auto (seuils)",
  AUTO_PLUIE: "Auto (pluie)",
  AUTO_EXTINCTION: "Auto (minuterie)",
}

// Ligne d'historique (GET /api/actionneurs/parcelle/{id}/commandes).
export interface CommandeActionneur {
  id: number
  etatDemande: boolean
  dateCommande: string
  origine: OrigineCommande
  utilisateurNomComplet: string | null
  actionneurNom: string | null
  actionneurType: TypeActionneur | null
}

// Page Spring Data (sous-ensemble utile).
export interface PageCommandes {
  content: CommandeActionneur[]
  totalPages: number
  totalElements: number
  number: number
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

// GET /api/actionneurs/parcelle/{id}/commandes — historique paginé des
// commandes de tous les actionneurs de la parcelle.
export function getHistoriqueCommandesParcelle(
  parcelleId: number,
  page = 0,
  size = 10,
): Promise<PageCommandes> {
  return apiFetch<PageCommandes>(
    `/actionneurs/parcelle/${parcelleId}/commandes?page=${page}&size=${size}`,
  )
}
