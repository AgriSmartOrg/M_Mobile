// Tickets de support : liste, détail, création (avec photos), commentaires.
// Copie adaptée de m_frontend/lib/tickets (périmètre client mobile).

import { apiFetch } from "./api"
import type { Page } from "./diagnostics"
import { joindreFichier } from "./fichiers"

export type { Page }

export type StatutTicket =
  | "SOUMIS"
  | "VALIDE"
  | "REJETE"
  | "AFFECTE"
  | "EN_COURS"
  | "RESOLU"
  | "FERME"
  | "REOUVERT"

export const STATUT_TICKET_LABELS: Record<StatutTicket, string> = {
  SOUMIS: "Soumis",
  VALIDE: "Validé",
  REJETE: "Rejeté",
  AFFECTE: "Affecté",
  EN_COURS: "En cours",
  RESOLU: "Résolu",
  FERME: "Fermé",
  REOUVERT: "Réouvert",
}

export interface PhotoTicket {
  id: number
  url: string
  nomFichierOriginal: string | null
  uploadedAt: string
}

export interface TicketResponse {
  id: number
  titre: string
  description: string
  statut: StatutTicket
  priorite: string | null
  motifRejet: string | null
  rapportIntervention: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  closedAt: string | null
  createurId: number
  createurNom: string
  createurPrenom: string
  createurRole: string
  technicienId: number | null
  technicienNom: string | null
  technicienPrenom: string | null
  parcelleId: number | null
  parcelleNom: string | null
  photos: PhotoTicket[]
  nombreCommentaires: number
}

export interface CommentaireTicketResponse {
  id: number
  contenu: string
  createdAt: string
  auteurId: number
  auteurNom: string
  auteurPrenom: string
  auteurRole: string
}

// Photo locale à joindre (URI expo-image-picker).
export interface PhotoLocale {
  uri: string
  mimeType: string
}

// POST /api/tickets (multipart, photos max 3).
export async function creerTicket(
  titre: string,
  description: string,
  parcelleId: number | null,
  photos: PhotoLocale[] = [],
): Promise<TicketResponse> {
  const form = new FormData()
  form.append("titre", titre)
  form.append("description", description)
  if (parcelleId != null) {
    form.append("parcelleId", String(parcelleId))
  }
  for (const [i, photo] of photos.entries()) {
    const extension = photo.mimeType.split("/")[1] ?? "jpg"
    await joindreFichier(
      form,
      "photos",
      photo.uri,
      photo.mimeType,
      `photo_${i + 1}.${extension}`,
    )
  }
  return apiFetch<TicketResponse>("/tickets", { method: "POST", body: form })
}

// GET /api/tickets — liste paginée (portée déterminée par le rôle).
export function getTickets(
  page = 0,
  size = 20,
): Promise<Page<TicketResponse>> {
  return apiFetch<Page<TicketResponse>>(`/tickets?page=${page}&size=${size}`)
}

// GET /api/tickets/{id}
export function getTicket(id: number): Promise<TicketResponse> {
  return apiFetch<TicketResponse>(`/tickets/${id}`)
}

// GET /api/tickets/{id}/commentaires
export function getCommentaires(
  ticketId: number,
): Promise<CommentaireTicketResponse[]> {
  return apiFetch<CommentaireTicketResponse[]>(
    `/tickets/${ticketId}/commentaires`,
  )
}

// POST /api/tickets/{id}/commentaire
export function ajouterCommentaire(
  ticketId: number,
  contenu: string,
): Promise<CommentaireTicketResponse> {
  return apiFetch<CommentaireTicketResponse>(
    `/tickets/${ticketId}/commentaire`,
    { method: "POST", body: { contenu } },
  )
}
