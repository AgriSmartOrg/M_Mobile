// Écran « Mon profil » : photo, prénom, nom, téléphone (alertes SMS).
// L'email n'est pas modifiable. Miroir mobile de account-settings.tsx (web).

import { useEffect, useState } from "react"
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import * as ImagePicker from "expo-image-picker"

import { Bouton, Champ, Carte } from "@/components/ui"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth/use-auth"
import {
  getMonProfil,
  mettreAJourMonProfil,
  uploadMaPhoto,
  type PhotoProfil,
} from "@/lib/profil"

export default function ProfilScreen() {
  const t = useTheme()
  const router = useRouter()
  const { user, mettreAJourUtilisateur } = useAuth()

  const [prenom, setPrenom] = useState(user?.prenom ?? "")
  const [nom, setNom] = useState(user?.nom ?? "")
  // Téléphone : absent du store d'auth, chargé depuis /utilisateurs/me.
  const [telephone, setTelephone] = useState("")
  const [telephoneInitial, setTelephoneInitial] = useState("")
  const [photo, setPhoto] = useState<PhotoProfil | null>(null)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let actif = true
    getMonProfil()
      .then((profil) => {
        if (!actif) return
        setTelephone(profil.telephone ?? "")
        setTelephoneInitial(profil.telephone ?? "")
      })
      .catch(() => {
        // Non bloquant : le champ téléphone reste vide.
      })
    return () => {
      actif = false
    }
  }, [])

  if (!user) return null

  const modifie =
    prenom.trim() !== user.prenom ||
    nom.trim() !== user.nom ||
    telephone.trim() !== telephoneInitial ||
    photo !== null

  const photoAffichee = photo?.uri ?? user.photoUrl ?? null
  const initiales = (user.prenom[0] ?? "") + (user.nom[0] ?? "")

  async function choisirPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!res.canceled && res.assets[0]) {
      setPhoto({
        uri: res.assets[0].uri,
        mimeType: res.assets[0].mimeType ?? "image/jpeg",
      })
    }
  }

  async function enregistrer() {
    if (!user || !modifie || busy) return
    if (!prenom.trim() || !nom.trim()) {
      setErreur("Le prénom et le nom sont obligatoires.")
      return
    }
    setErreur(null)
    setBusy(true)
    try {
      let photoUrl = user.photoUrl

      if (photo) {
        const maj = await uploadMaPhoto(photo)
        photoUrl = maj.photoUrl
      }

      if (
        prenom.trim() !== user.prenom ||
        nom.trim() !== user.nom ||
        telephone.trim() !== telephoneInitial
      ) {
        await mettreAJourMonProfil({
          nom: nom.trim(),
          prenom: prenom.trim(),
          telephone: telephone.trim(),
        })
        setTelephoneInitial(telephone.trim())
      }

      // Synchronise l'onglet Plus (nom affiché, avatar).
      mettreAJourUtilisateur({
        nom: nom.trim(),
        prenom: prenom.trim(),
        photoUrl,
      })
      setPhoto(null)

      Alert.alert("Profil mis à jour", "", [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (e) {
      setErreur(
        e instanceof ApiError ? e.message : "Mise à jour impossible.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.contenu}
    >
      <Carte>
        {/* ── Photo ── */}
        <View style={styles.photoBloc}>
          {photoAffichee ? (
            <Image source={{ uri: photoAffichee }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, { backgroundColor: t.primaryMuted }]}>
              <Text style={[styles.initiales, { color: t.primary }]}>
                {initiales}
              </Text>
            </View>
          )}
          <Pressable onPress={choisirPhoto} disabled={busy}>
            <Text style={{ color: t.primary, fontWeight: "600" }}>
              Changer la photo
            </Text>
          </Pressable>
          <Text style={{ color: t.textSecondary, fontSize: 12 }}>
            JPG, PNG ou WEBP (5 Mo max).
          </Text>
        </View>

        {/* ── Champs ── */}
        <Champ
          label="Prénom"
          value={prenom}
          onChangeText={setPrenom}
          editable={!busy}
          autoCapitalize="words"
        />
        <Champ
          label="Nom"
          value={nom}
          onChangeText={setNom}
          editable={!busy}
          autoCapitalize="words"
        />
        <Champ label="Email" value={user.email} editable={false} />
        <View style={{ gap: Spacing.xs }}>
          <Champ
            label="Téléphone (alertes SMS)"
            value={telephone}
            onChangeText={setTelephone}
            editable={!busy}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="+22890123456"
          />
          <Text style={{ color: t.textSecondary, fontSize: 12 }}>
            Format international. Utilisé pour recevoir les alertes critiques
            par SMS.
          </Text>
        </View>

        {erreur ? (
          <Text style={{ color: t.danger, fontSize: 13 }}>{erreur}</Text>
        ) : null}

        <Bouton
          titre={busy ? "Enregistrement…" : "Enregistrer"}
          onPress={() => void enregistrer()}
          desactive={!modifie}
          chargement={busy}
        />
      </Carte>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.md, gap: Spacing.md },
  photoBloc: {
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  initiales: { fontSize: 32, fontWeight: "700" },
})
