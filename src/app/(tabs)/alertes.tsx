// Alertes : liste filtrable (toutes / non résolues), marquer lue / résolue.
// Pagination côté serveur : pages suivantes chargées au fil du défilement.

import { useCallback, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useFocusEffect } from "expo-router"

import { Badge, Carte, Chargement, EtatVide } from "@/components/ui"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import {
  getAlertes,
  marquerAlerteLue,
  NIVEAU_LABELS,
  resoudreAlerte,
  type Alerte,
  type FiltreAlerte,
} from "@/lib/alertes"

type Filtre = "NON_RESOLUES" | "TOUTES"

export default function AlertesScreen() {
  const t = useTheme()

  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [filtre, setFiltre] = useState<Filtre>("NON_RESOLUES")
  const [chargement, setChargement] = useState(true)
  const [rafraichissement, setRafraichissement] = useState(false)
  const [pageSuivanteEnCours, setPageSuivanteEnCours] = useState(false)
  const pageRef = useRef(0)
  const totalPagesRef = useRef(0)

  const filtreApi = useCallback(
    (f: Filtre): FiltreAlerte | undefined =>
      f === "NON_RESOLUES" ? "NON_RESOLUES" : undefined,
    [],
  )

  // Recharge la première page (montage, focus, pull-to-refresh, filtre).
  const charger = useCallback(
    async (f: Filtre) => {
      try {
        const p = await getAlertes(filtreApi(f), 0)
        setAlertes(p.content)
        pageRef.current = p.number
        totalPagesRef.current = p.totalPages
      } catch {
        // Réseau indisponible.
      }
    },
    [filtreApi],
  )

  useFocusEffect(
    useCallback(() => {
      let actif = true
      void charger(filtre).finally(() => {
        if (actif) setChargement(false)
      })
      return () => {
        actif = false
      }
    }, [charger, filtre]),
  )

  async function chargerPageSuivante() {
    if (pageSuivanteEnCours) return
    if (pageRef.current >= totalPagesRef.current - 1) return
    setPageSuivanteEnCours(true)
    try {
      const p = await getAlertes(filtreApi(filtre), pageRef.current + 1)
      setAlertes((prev) => [...prev, ...p.content])
      pageRef.current = p.number
      totalPagesRef.current = p.totalPages
    } catch {
      // silencieux : retenté au prochain défilement
    } finally {
      setPageSuivanteEnCours(false)
    }
  }

  function changerFiltre(f: Filtre) {
    if (f === filtre) return
    setFiltre(f)
    setChargement(true)
    void charger(f).finally(() => setChargement(false))
  }

  async function lue(a: Alerte) {
    try {
      const maj = await marquerAlerteLue(a.id)
      setAlertes((liste) => liste.map((x) => (x.id === maj.id ? maj : x)))
    } catch {
      // silencieux
    }
  }

  async function resoudre(a: Alerte) {
    try {
      const maj = await resoudreAlerte(a.id)
      // En vue « non résolues », l'alerte résolue sort de la liste.
      setAlertes((liste) =>
        filtre === "NON_RESOLUES"
          ? liste.filter((x) => x.id !== maj.id)
          : liste.map((x) => (x.id === maj.id ? maj : x)),
      )
    } catch {
      // silencieux
    }
  }

  if (chargement) return <Chargement />

  const affichees = alertes

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Filtres */}
      <View style={styles.filtres}>
        {(
          [
            ["NON_RESOLUES", "Non résolues"],
            ["TOUTES", "Toutes"],
          ] as [Filtre, string][]
        ).map(([valeur, label]) => (
          <Pressable
            key={valeur}
            onPress={() => changerFiltre(valeur)}
            style={[
              styles.filtre,
              {
                backgroundColor: filtre === valeur ? t.primary : t.card,
                borderColor: filtre === valeur ? t.primary : t.border,
              },
            ]}
          >
            <Text
              style={{
                color: filtre === valeur ? "#ffffff" : t.text,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        contentContainerStyle={styles.liste}
        data={affichees}
        keyExtractor={(a) => String(a.id)}
        onEndReached={() => void chargerPageSuivante()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          pageSuivanteEnCours ? (
            <ActivityIndicator color={t.primary} style={{ padding: Spacing.md }} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={rafraichissement}
            onRefresh={async () => {
              setRafraichissement(true)
              await charger(filtre)
              setRafraichissement(false)
            }}
          />
        }
        ListEmptyComponent={
          <EtatVide
            message={
              filtre === "NON_RESOLUES"
                ? "Aucune alerte non résolue. Tout va bien."
                : "Aucune alerte."
            }
          />
        }
        renderItem={({ item }) => (
          <Carte style={item.lue ? { opacity: 0.75 } : undefined}>
            <View style={styles.entete}>
              <Badge
                texte={NIVEAU_LABELS[item.niveau]}
                ton={
                  item.niveau === "CRITIQUE" || item.niveau === "URGENCE"
                    ? "danger"
                    : item.niveau === "ATTENTION"
                      ? "warning"
                      : "info"
                }
              />
              {item.resolue ? <Badge texte="Résolue" ton="primaire" /> : null}
            </View>
            <Text style={{ color: t.text }}>{item.message}</Text>
            <Text style={{ color: t.textSecondary, fontSize: 12 }}>
              {item.parcelleNom} ·{" "}
              {new Date(item.date).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </Text>
            {!item.resolue ? (
              <View style={styles.actions}>
                {!item.lue ? (
                  <Pressable onPress={() => lue(item)}>
                    <Text style={{ color: t.info, fontWeight: "600" }}>
                      Marquer lue
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => resoudre(item)}>
                  <Text style={{ color: t.primary, fontWeight: "600" }}>
                    Marquer résolue
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Carte>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  filtres: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  filtre: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  liste: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  entete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
})
