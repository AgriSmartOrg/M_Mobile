// Création d'un ticket de support : titre, description, parcelle optionnelle,
// photos (max 3, caméra ou galerie).

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
import { Ionicons } from "@expo/vector-icons"

import { Badge, Bouton, Carte, Champ } from "@/components/ui"
import { Radius, Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import { getParcelles, type Parcelle } from "@/lib/parcelles"
import { creerTicket, type PhotoLocale } from "@/lib/tickets"

const MAX_PHOTOS = 3

export default function NouveauTicketScreen() {
  const t = useTheme()
  const router = useRouter()

  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [parcelles, setParcelles] = useState<Parcelle[]>([])
  const [parcelleId, setParcelleId] = useState<number | null>(null)
  const [photos, setPhotos] = useState<PhotoLocale[]>([])
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    let actif = true
    getParcelles()
      .then((ps) => {
        if (actif) setParcelles(ps)
      })
      .catch(() => {})
    return () => {
      actif = false
    }
  }, [])

  async function ajouterPhoto() {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Limite atteinte", `Maximum ${MAX_PHOTOS} photos.`)
      return
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    })
    if (!res.canceled && res.assets[0]) {
      setPhotos((liste) => [
        ...liste,
        {
          uri: res.assets[0].uri,
          mimeType: res.assets[0].mimeType ?? "image/jpeg",
        },
      ])
    }
  }

  async function soumettre() {
    if (!titre.trim() || !description.trim()) {
      Alert.alert("Champs requis", "Veuillez saisir un titre et une description.")
      return
    }
    setEnvoi(true)
    try {
      await creerTicket(titre.trim(), description.trim(), parcelleId, photos)
      Alert.alert(
        "Ticket envoyé",
        "Votre signalement a été transmis. Vous serez notifié de son avancement.",
      )
      router.back()
    } catch (e) {
      Alert.alert(
        "Échec",
        e instanceof Error ? e.message : "Impossible d'envoyer le ticket.",
      )
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.contenu}
      keyboardShouldPersistTaps="handled"
    >
      <Champ
        label="Titre"
        value={titre}
        onChangeText={setTitre}
        placeholder="Ex. : capteur d'humidité muet"
      />
      <Champ
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Décrivez le problème rencontré…"
        multiline
        numberOfLines={5}
        style={styles.zoneTexte}
      />

      {/* ── Parcelle concernée (optionnel) ── */}
      <Carte>
        <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: "500" }}>
          Parcelle concernée (optionnel)
        </Text>
        <View style={styles.puces}>
          <Pressable onPress={() => setParcelleId(null)}>
            <Badge
              texte="Aucune"
              ton={parcelleId === null ? "primaire" : "neutre"}
            />
          </Pressable>
          {parcelles.map((p) => (
            <Pressable key={p.id} onPress={() => setParcelleId(p.id)}>
              <Badge
                texte={p.nom}
                ton={parcelleId === p.id ? "primaire" : "neutre"}
              />
            </Pressable>
          ))}
        </View>
      </Carte>

      {/* ── Photos ── */}
      <Carte>
        <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: "500" }}>
          Photos ({photos.length}/{MAX_PHOTOS})
        </Text>
        <View style={styles.photos}>
          {photos.map((p, i) => (
            <View key={p.uri}>
              <Image source={{ uri: p.uri }} style={styles.vignette} />
              <Pressable
                style={[styles.supprimer, { backgroundColor: t.danger }]}
                onPress={() =>
                  setPhotos((liste) => liste.filter((_, j) => j !== i))
                }
              >
                <Ionicons name="close" size={14} color="#ffffff" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <Pressable
              style={[styles.ajout, { borderColor: t.border }]}
              onPress={ajouterPhoto}
            >
              <Ionicons name="add" size={26} color={t.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </Carte>

      <Bouton titre="Envoyer le ticket" onPress={soumettre} chargement={envoi} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.md, gap: Spacing.md },
  zoneTexte: { minHeight: 110, textAlignVertical: "top" },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  vignette: { width: 72, height: 72, borderRadius: Radius.sm },
  supprimer: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ajout: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
})
