// Diagnostic IA : photographier une plante malade (caméra ou galerie),
// l'envoyer au backend (analyse Gemini) et afficher le résultat +
// l'historique des diagnostics de l'utilisateur.

import { useCallback, useState } from "react"
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useFocusEffect } from "expo-router"
import * as ImagePicker from "expo-image-picker"

import { Badge, Bouton, Carte, EtatVide } from "@/components/ui"
import { Radius, Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import { useAuth } from "@/lib/auth/use-auth"
import {
  analyserImage,
  getDiagnosticsByUtilisateur,
  type DiagnosticIA,
} from "@/lib/diagnostics"

export default function DiagnosticScreen() {
  const t = useTheme()
  const { user } = useAuth()

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>("image/jpeg")
  const [analyse, setAnalyse] = useState(false)
  const [resultat, setResultat] = useState<DiagnosticIA | null>(null)
  const [historique, setHistorique] = useState<DiagnosticIA[]>([])
  const [rafraichissement, setRafraichissement] = useState(false)

  const chargerHistorique = useCallback(async () => {
    if (!user) return
    try {
      const page = await getDiagnosticsByUtilisateur(user.utilisateurId, 0, 10)
      setHistorique(page.content)
    } catch {
      // Réseau indisponible.
    }
  }, [user])

  useFocusEffect(
    useCallback(() => {
      void chargerHistorique()
    }, [chargerHistorique]),
  )

  async function prendrePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à la caméra pour photographier la plante.",
      )
      return
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    })
    if (!res.canceled && res.assets[0]) {
      setResultat(null)
      setImageUri(res.assets[0].uri)
      setMimeType(res.assets[0].mimeType ?? "image/jpeg")
    }
  }

  async function choisirGalerie() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    })
    if (!res.canceled && res.assets[0]) {
      setResultat(null)
      setImageUri(res.assets[0].uri)
      setMimeType(res.assets[0].mimeType ?? "image/jpeg")
    }
  }

  async function lancerAnalyse() {
    if (!imageUri || !user) return
    setAnalyse(true)
    try {
      const diag = await analyserImage(imageUri, mimeType, user.utilisateurId)
      setResultat(diag)
      setImageUri(null)
      void chargerHistorique()
    } catch (e) {
      Alert.alert(
        "Échec de l'analyse",
        e instanceof Error ? e.message : "Veuillez réessayer.",
      )
    } finally {
      setAnalyse(false)
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.contenu}
      refreshControl={
        <RefreshControl
          refreshing={rafraichissement}
          onRefresh={async () => {
            setRafraichissement(true)
            await chargerHistorique()
            setRafraichissement(false)
          }}
        />
      }
    >
      <Text style={{ color: t.textSecondary }}>
        Photographiez une plante malade : l&apos;intelligence artificielle
        identifie la maladie et conseille un traitement.
      </Text>

      {/* ── Sélection de la photo ── */}
      <Carte>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.apercu}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.zoneVide,
              { borderColor: t.border, backgroundColor: t.background },
            ]}
          >
            <Text style={{ color: t.textSecondary, textAlign: "center" }}>
              Aucune photo sélectionnée
            </Text>
          </View>
        )}

        <View style={styles.rangee}>
          <Bouton
            titre="Caméra"
            variante="secondaire"
            onPress={prendrePhoto}
            style={{ flex: 1 }}
          />
          <Bouton
            titre="Galerie"
            variante="secondaire"
            onPress={choisirGalerie}
            style={{ flex: 1 }}
          />
        </View>

        <Bouton
          titre={analyse ? "Analyse en cours…" : "Lancer l'analyse"}
          onPress={lancerAnalyse}
          desactive={!imageUri}
          chargement={analyse}
        />
      </Carte>

      {/* ── Résultat ── */}
      {resultat ? (
        <Carte>
          <View style={styles.enteteResultat}>
            <Text style={[styles.maladie, { color: t.text }]}>
              {resultat.maladieDetectee}
            </Text>
            <Badge texte={resultat.confiance} ton="primaire" />
          </View>
          <Text style={{ color: t.textSecondary }}>
            {resultat.recommendation}
          </Text>
        </Carte>
      ) : null}

      {/* ── Historique ── */}
      <Text style={[styles.sectionTitre, { color: t.text }]}>
        Mes diagnostics
      </Text>
      {historique.length === 0 ? (
        <EtatVide message="Aucun diagnostic pour le moment." />
      ) : (
        historique.map((d) => (
          <Carte key={d.id}>
            <View style={styles.rangee}>
              <Image
                source={{ uri: d.imageUrl }}
                style={styles.vignette}
                resizeMode="cover"
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: t.text, fontWeight: "700" }}>
                  {d.maladieDetectee}
                </Text>
                <Text
                  style={{ color: t.textSecondary, fontSize: 13 }}
                  numberOfLines={3}
                >
                  {d.recommendation}
                </Text>
                <Text style={{ color: t.textSecondary, fontSize: 11 }}>
                  {new Date(d.createdAt).toLocaleDateString("fr-FR")} ·
                  confiance {d.confiance}
                </Text>
              </View>
            </View>
          </Carte>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.md, gap: Spacing.md },
  apercu: { width: "100%", height: 220, borderRadius: Radius.md },
  zoneVide: {
    height: 160,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  rangee: { flexDirection: "row", gap: Spacing.sm },
  enteteResultat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  maladie: { fontSize: 17, fontWeight: "700", flex: 1 },
  sectionTitre: { fontSize: 18, fontWeight: "700" },
  vignette: { width: 72, height: 72, borderRadius: Radius.sm },
})
