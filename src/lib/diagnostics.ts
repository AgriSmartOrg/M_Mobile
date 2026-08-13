// Diagnostics IA : upload d'une photo de plante malade → analyse Gemini.
// L'upload part d'un fichier local (URI expo-image-picker) via FormData.

import { apiFetch } from "./api"
import { joindreFichier } from "./fichiers"

export interface DiagnosticIA {
  id: number
  imageUrl: string
  maladieDetectee: string
  confiance: string
  recommendation: string
  createdAt: string
  utilisateurId: number
  utilisateurNom: string
  utilisateurPrenom: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// POST /api/diagnostics (multipart). Le fichier est joint via joindreFichier
// (objet { uri, name, type } sur natif, Blob sur web).
export async function analyserImage(
  imageUri: string,
  mimeType: string,
  utilisateurId: number,
): Promise<DiagnosticIA> {
  const form = new FormData()
  const extension = mimeType.split("/")[1] ?? "jpg"
  await joindreFichier(
    form,
    "image",
    imageUri,
    mimeType,
    `diagnostic.${extension}`,
  )
  form.append("utilisateurId", String(utilisateurId))
  return apiFetch<DiagnosticIA>("/diagnostics", {
    method: "POST",
    body: form,
  })
}

// GET /api/diagnostics/utilisateur/{id} — historique paginé.
export function getDiagnosticsByUtilisateur(
  utilisateurId: number,
  page = 0,
  size = 10,
): Promise<Page<DiagnosticIA>> {
  return apiFetch<Page<DiagnosticIA>>(
    `/diagnostics/utilisateur/${utilisateurId}?page=${page}&size=${size}`,
  )
}
