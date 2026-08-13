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

// GET /api/alertes — toutes les alertes des parcelles accessibles.
export function getAlertes(): Promise<Alerte[]> {
  return apiFetch<Alerte[]>("/alertes")
}

// PATCH /api/alertes/{id}/lire
export function marquerAlerteLue(id: number): Promise<Alerte> {
  return apiFetch<Alerte>(`/alertes/${id}/lire`, { method: "PATCH" })
}

// PATCH /api/alertes/{id}/resoudre
export function resoudreAlerte(id: number): Promise<Alerte> {
  return apiFetch<Alerte>(`/alertes/${id}/resoudre`, { method: "PATCH" })
}
