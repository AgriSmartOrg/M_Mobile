// Historique des mesures d'une parcelle, par type de capteur.
// Aligné sur GET /api/mesures/parcelle/{id}/type/{type} (Page<MesureResponse>,
// triée par date décroissante — inversée ici pour l'affichage chronologique).

import { apiFetch } from "./api"
import type { Page } from "./diagnostics"

export type TypeCapteur =
  | "HUMIDITE_SOL"
  | "HUMIDITE_AIR"
  | "TEMPERATURE_SOL"
  | "TEMPERATURE_AIR"
  | "PH_SOL"
  | "NPK_AZOTE"
  | "NPK_PHOSPHORE"
  | "NPK_POTASSIUM"
  | "LUMINOSITE"
  | "PLUIE"

export interface Mesure {
  id: number
  valeur: number
  date: string
  qualite: string | null
  capteurId: number
  capteurNom: string
  capteurType: TypeCapteur
  capteurUnite: string | null
  parcelleId: number
  parcelleNom: string
}

// Types proposés dans le sélecteur d'historique (libellé court pour les puces).
export const TYPES_HISTORIQUE: { type: TypeCapteur; label: string }[] = [
  { type: "HUMIDITE_SOL", label: "Humidité sol" },
  { type: "TEMPERATURE_AIR", label: "Temp. air" },
  { type: "HUMIDITE_AIR", label: "Humidité air" },
  { type: "TEMPERATURE_SOL", label: "Temp. sol" },
  { type: "LUMINOSITE", label: "Luminosité" },
  { type: "PH_SOL", label: "pH sol" },
  { type: "NPK_AZOTE", label: "Azote" },
  { type: "NPK_PHOSPHORE", label: "Phosphore" },
  { type: "NPK_POTASSIUM", label: "Potassium" },
]

// Dernières mesures d'un type sur une parcelle, en ordre chronologique.
export async function getHistoriqueMesures(
  parcelleId: number,
  type: TypeCapteur,
  nombre = 48,
): Promise<Mesure[]> {
  const page = await apiFetch<Page<Mesure>>(
    `/mesures/parcelle/${parcelleId}/type/${type}?page=0&size=${nombre}`,
  )
  return page.content.slice().reverse()
}
