// Alertes de dépassement de seuil : liste, marquer lue / résolue.

import { apiFetch } from "./api"
import type { NiveauAlerte } from "./parcelles"

export type { NiveauAlerte }

export const NIVEAU_LABELS: Record<NiveauAlerte, string> = {
  INFO: "Information",
  ATTENTION: "Attention",
  CRITIQUE: "Critique",
  URGENCE: "Urgence",
}

export interface Alerte {
  id: number
  message: string
  niveau: NiveauAlerte
  typeCapteur: string
  lue: boolean
  resolue: boolean
  date: string
  parcelleId: number
  parcelleNom: string
  mesureId: number | null
  valeurMesuree: number | null
}

// GET /api/alertes — alertes paginées des parcelles accessibles.
// filtre : NON_LUES | NON_RESOLUES (absent = toutes).
export type FiltreAlerte = "NON_LUES" | "NON_RESOLUES"

export interface PageAlertes {
  content: Alerte[]
  totalPages: number
  totalElements: number
  number: number
}

export function getAlertes(
  filtre?: FiltreAlerte,
  page = 0,
  size = 10,
): Promise<PageAlertes> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(size))
  if (filtre) params.set("filtre", filtre)
  return apiFetch<PageAlertes>(`/alertes?${params.toString()}`)
}

// GET /api/alertes/nb-non-resolues — compteur pour le badge de l'onglet.
export function getNbAlertesNonResolues(): Promise<number> {
  return apiFetch<number>("/alertes/nb-non-resolues")
}

// PATCH /api/alertes/{id}/lire
export function marquerAlerteLue(id: number): Promise<Alerte> {
  return apiFetch<Alerte>(`/alertes/${id}/lire`, { method: "PATCH" })
}

// PATCH /api/alertes/{id}/resoudre
export function resoudreAlerte(id: number): Promise<Alerte> {
  return apiFetch<Alerte>(`/alertes/${id}/resoudre`, { method: "PATCH" })
}
