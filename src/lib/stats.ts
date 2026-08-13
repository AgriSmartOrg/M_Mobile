// Statistiques du tableau de bord client (ADMIN / AGRICULTEUR).
// Aligné sur GET /api/stats/dashboard-client (DashboardClientResponse).

import { apiFetch } from "./api"

export interface MesurePoint {
  date: string
  valeur: number
}

export interface ApercuCapteur {
  capteurId: number
  capteurNom: string
  type: string
  unite: string
  valeurMin: number
  valeurMax: number
  parcelleId: number | null
  parcelleNom: string
  points: MesurePoint[]
}

export interface DashboardClient {
  totalParcelles: number
  totalDispositifs: number
  dispositifsEnLigne: number
  dispositifsHorsLigne: number
  totalCapteurs: number
  culturesActives: number
  alertesActives: number
  apercuCapteurs: ApercuCapteur[]
}

export function getDashboardClient(): Promise<DashboardClient> {
  return apiFetch<DashboardClient>("/stats/dashboard-client")
}
