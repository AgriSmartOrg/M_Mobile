// Liste des parcelles accessibles à l'utilisateur.

import { useCallback, useState } from "react"
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useFocusEffect, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { Badge, Carte, Chargement, EtatVide } from "@/components/ui"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import {
  ENVIRONNEMENT_LABELS,
  TYPE_SOL_LABELS,
  getParcelles,
  type Parcelle,
} from "@/lib/parcelles"

export default function ParcellesScreen() {
  const t = useTheme()
  const router = useRouter()

  const [parcelles, setParcelles] = useState<Parcelle[]>([])
  const [chargement, setChargement] = useState(true)
  const [rafraichissement, setRafraichissement] = useState(false)

  const charger = useCallback(async () => {
    try {
      setParcelles(await getParcelles())
    } catch {
      // Réseau indisponible : liste précédente conservée.
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      let actif = true
      void charger().finally(() => {
        if (actif) setChargement(false)
      })
      return () => {
        actif = false
      }
    }, [charger]),
  )

  if (chargement) return <Chargement />

  return (
    <FlatList
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.liste}
      data={parcelles}
      keyExtractor={(p) => String(p.id)}
      refreshControl={
        <RefreshControl
          refreshing={rafraichissement}
          onRefresh={async () => {
            setRafraichissement(true)
            await charger()
            setRafraichissement(false)
          }}
        />
      }
      ListEmptyComponent={
        <EtatVide message="Aucune parcelle ne vous est assignée pour le moment." />
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.navigate(`/(tabs)/parcelles/${item.id}`)}>
          <Carte>
            <View style={styles.entete}>
              <Text style={[styles.nom, { color: t.text }]}>{item.nom}</Text>
              <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
            </View>
            <View style={styles.badges}>
              <Badge texte={`${item.superficie} m²`} ton="primaire" />
              <Badge texte={TYPE_SOL_LABELS[item.typeSol]} />
              <Badge texte={ENVIRONNEMENT_LABELS[item.environnement]} ton="info" />
            </View>
            {item.description ? (
              <Text
                style={{ color: t.textSecondary, fontSize: 13 }}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
          </Carte>
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  liste: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  entete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nom: { fontSize: 17, fontWeight: "700" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
})
