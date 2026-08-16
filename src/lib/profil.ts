// Profil de l'utilisateur connecté : lecture, mise à jour (nom, prénom,
// téléphone) et changement de la photo (multipart vers Supabase Storage).
// Aligné sur UtilisateurController /api/utilisateurs/me (web : account-settings).

import { apiFetch } from "./api"
import { joindreFichier } from "./fichiers"

// Sous-ensemble utile de UtilisateurResponse (backend).
export interface ProfilUtilisateur {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string | null
  photoUrl: string | null
}

// Corps de PUT /api/utilisateurs/me (ProfilUpdateRequest backend).
// L'email n'est pas modifiable ; téléphone vide = pas d'alertes SMS.
export interface ProfilUpdateRequest {
  nom: string
  prenom: string
  telephone: string
}

// Photo locale sélectionnée via expo-image-picker.
export interface PhotoProfil {
  uri: string
  mimeType: string
}

// GET /api/utilisateurs/me — profil complet (dont téléphone, absent du store d'auth).
export function getMonProfil(): Promise<ProfilUtilisateur> {
  return apiFetch<ProfilUtilisateur>("/utilisateurs/me")
}

// PUT /api/utilisateurs/me — met à jour nom / prénom / téléphone.
export function mettreAJourMonProfil(
  data: ProfilUpdateRequest,
): Promise<ProfilUtilisateur> {
  return apiFetch<ProfilUtilisateur>("/utilisateurs/me", {
    method: "PUT",
    body: data,
  })
}

// POST /api/utilisateurs/me/photo — remplace la photo de profil (champ « photo »).
export async function uploadMaPhoto(
  photo: PhotoProfil,
): Promise<ProfilUtilisateur> {
  const form = new FormData()
  const extension = photo.mimeType.split("/")[1] ?? "jpg"
  await joindreFichier(form, "photo", photo.uri, photo.mimeType, `avatar.${extension}`)
  return apiFetch<ProfilUtilisateur>("/utilisateurs/me/photo", {
    method: "POST",
    body: form,
  })
}
