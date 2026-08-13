// Accueil : vue d'ensemble de l'exploitation (stats client) et
// dernières alertes non résolues.

import { useCallback, useState } from "react"
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useFocusEffect, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { Badge, Carte, Chargement, EtatVide } from "@/components/ui"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import { getAlertes, type Alerte } from "@/lib/alertes"
import { useAuth } from "@/lib/auth/use-auth"
import { getDashboardClient, type DashboardClient } from "@/lib/stats"

export default function AccueilScreen() {
  const t = useTheme()
  const router = useRouter()
  const { user } = useAuth()

  const [stats, setStats] = useState<DashboardClient | null>(null)
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [chargement, setChargement] = useState(true)
  const [rafraichissement, setRafraichissement] = useState(false)

  const charger = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([getDashboardClient(), getAlertes()])
      setStats(s)
      setAlertes(a.filter((al) => !al.resolue).slice(0, 5))
    } catch {
      // Erreur réseau : on garde les données précédentes.
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

  async function rafraichir() {
    setRafraichissement(true)
    await charger()
    setRafraichissement(false)
  }

  if (chargement) return <Chargement />

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.contenu}
      refreshControl={
        <RefreshControl refreshing={rafraichissement} onRefresh={rafraichir} />
      }
    >
      <Text style={[styles.salutation, { color: t.text }]}>
        Bonjour {user?.prenom}
      </Text>
      {user?.organisationNom ? (
        <Text style={{ color: t.textSecondary, marginTop: -Spacing.sm }}>
          {user.organisationNom}
        </Text>
      ) : null}

      {stats ? (
        <View style={styles.grille}>
          <CarteStat
            icone="map-outline"
            valeur={stats.totalParcelles}
            libelle="Parcelles"
          />
          <CarteStat
            icone="leaf-outline"
            valeur={stats.culturesActives}
            libelle="Cultures en cours"
          />
          <CarteStat
            icone="hardware-chip-outline"
            valeur={stats.dispositifsEnLigne}
            libelle={`Dispositifs en ligne / ${stats.totalDispositifs}`}
          />
          <CarteStat
            icone="warning-outline"
            valeur={stats.alertesActives}
            libelle="Alertes actives"
            accent={stats.alertesActives > 0 ? "danger" : "primaire"}
          />
        </View>
      ) : (
        <EtatVide message="Impossible de charger les statistiques. Tirez pour réessayer." />
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitre, { color: t.text }]}>
          Dernières alertes
        </Text>
        {alertes.length === 0 ? (
          <Carte>
            <Text style={{ color: t.textSecondary }}>
              Aucune alerte non résolue. Tout va bien.
            </Text>
          </Carte>
        ) : (
          alertes.map((a) => (
            <Carte key={a.id}>
              <View style={styles.alerteLigne}>
                <Badge
                  texte={a.niveau}
                  ton={
                    a.niveau === "CRITIQUE" || a.niveau === "URGENCE"
                      ? "danger"
                      : a.niveau === "ATTENTION"
                        ? "warning"
                        : "info"
                  }
                />
                <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                  {new Date(a.date).toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <Text style={{ color: t.text }} numberOfLines={2}>
                {a.message}
              </Text>
              <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                {a.parcelleNom}
              </Text>
            </Carte>
          ))
        )}
        {alertes.length > 0 ? (
          <Text
            style={{ color: t.primary, fontWeight: "600" }}
            onPress={() => router.navigate("/(tabs)/alertes")}
          >
            Voir toutes les alertes →
          </Text>
        ) : null}
      </View>
    </ScrollView>
  )
}

function CarteStat({
  icone,
  valeur,
  libelle,
  accent = "primaire",
}: {
  icone: keyof typeof Ionicons.glyphMap
  valeur: number
  libelle: string
  accent?: "primaire" | "danger"
}) {
  const t = useTheme()
  const couleur = accent === "danger" ? t.danger : t.primary
  return (
    <Carte style={styles.carteStat}>
      <Ionicons name={icone} size={22} color={couleur} />
      <Text style={[styles.statValeur, { color: t.text }]}>{valeur}</Text>
      <Text style={{ color: t.textSecondary, fontSize: 12 }}>{libelle}</Text>
    </Carte>
  )
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.md, gap: Spacing.md },
  salutation: { fontSize: 24, fontWeight: "700" },
  grille: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  carteStat: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: Spacing.xs,
  },
  statValeur: { fontSize: 26, fontWeight: "700" },
  section: { gap: Spacing.sm, marginTop: Spacing.sm },
  sectionTitre: { fontSize: 18, fontWeight: "700" },
  alerteLigne: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
