// Parcelles : liste, tableau de bord (mesures, culture, alertes) et
// dispositifs installés. Copie adaptée des libs web correspondantes.

import { apiFetch } from "./api"

export type TypeSol =
  | "ARGILEUX"
  | "SABLONNEUX"
  | "LIMONEUX"
  | "HUMIFERE"
  | "LATERITIQUE"

export type Environnement = "PLEIN_AIR" | "CONTROLE"

export const TYPE_SOL_LABELS: Record<TypeSol, string> = {
  ARGILEUX: "Argileux",
  SABLONNEUX: "Sablonneux",
  LIMONEUX: "Limoneux",
  HUMIFERE: "Humifère",
  LATERITIQUE: "Latéritique",
}

export const ENVIRONNEMENT_LABELS: Record<Environnement, string> = {
  PLEIN_AIR: "Plein air",
  CONTROLE: "Contrôlé",
}

export interface Parcelle {
  id: number
  nom: string
  description?: string
  superficie: number
  latitude: number
  longitude: number
  typeSol: TypeSol
  environnement: Environnement
  actif: boolean
  dateCreation: string
  photoUrl?: string | null
}

export interface CultureActive {
  id: number
  typeCultureNom: string
  typeCultureVariete: string
  statut: string
  saison: string
  dateDebut: string
}

export type NiveauAlerte = "INFO" | "ATTENTION" | "CRITIQUE" | "URGENCE"

export interface AlerteResume {
  id: number
  messageListible: string
  niveau: NiveauAlerte
  facteur: string
  valeurMesuree: number | null
  date: string
  lue: boolean
}

export interface TableauDeBordParcelle {
  parcelleId: number
  parcelleNom: string
  parcelleDescription: string | null
  superficie: number
  typeSol: TypeSol
  environnement: Environnement
  latitude: number | null
  longitude: number | null
  culture: CultureActive | null
  alertes: AlerteResume[]
  totalAlertesNonResolues: number
}

export interface Dispositif {
  id: number
  nom: string
  adresseMac: string
  description?: string | null
  statut: "ONLINE" | "OFFLINE"
  batteriePct: number
  dernierePing: string | null
  parcelleId: number | null
  parcelleNom: string | null
  dateCreation: string
}

// GET /api/parcelles — parcelles accessibles à l'utilisateur courant.
export function getParcelles(): Promise<Parcelle[]> {
  return apiFetch<Parcelle[]>("/parcelles")
}

// GET /api/parcelles/{id}/tableau-de-bord — vue synthétique.
export function getTableauDeBordParcelle(
  id: number,
): Promise<TableauDeBordParcelle> {
  return apiFetch<TableauDeBordParcelle>(`/parcelles/${id}/tableau-de-bord`)
}

// GET /api/dispositifs/parcelle/{id} — dispositifs installés sur la parcelle.
export function getDispositifsByParcelle(
  parcelleId: number,
): Promise<Dispositif[]> {
  return apiFetch<Dispositif[]>(`/dispositifs/parcelle/${parcelleId}`)
}
