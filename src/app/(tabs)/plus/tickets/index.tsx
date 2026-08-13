// Liste des tickets de support de l'utilisateur.

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

import { Badge, Bouton, Carte, Chargement, EtatVide } from "@/components/ui"
import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import {
  getTickets,
  STATUT_TICKET_LABELS,
  type StatutTicket,
  type TicketResponse,
} from "@/lib/tickets"

function tonStatut(statut: StatutTicket): "primaire" | "danger" | "warning" | "info" | "neutre" {
  switch (statut) {
    case "RESOLU":
    case "FERME":
      return "primaire"
    case "REJETE":
      return "danger"
    case "EN_COURS":
    case "AFFECTE":
      return "info"
    case "REOUVERT":
      return "warning"
    default:
      return "neutre"
  }
}

export default function TicketsScreen() {
  const t = useTheme()
  const router = useRouter()

  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [chargement, setChargement] = useState(true)
  const [rafraichissement, setRafraichissement] = useState(false)

  const charger = useCallback(async () => {
    try {
      const page = await getTickets(0, 50)
      setTickets(page.content)
    } catch {
      // Réseau indisponible.
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
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <FlatList
        contentContainerStyle={styles.liste}
        data={tickets}
        keyExtractor={(tk) => String(tk.id)}
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
        ListHeaderComponent={
          <Bouton
            titre="+ Signaler un problème"
            onPress={() => router.navigate("/(tabs)/plus/tickets/nouveau")}
            style={{ marginBottom: Spacing.sm }}
          />
        }
        ListEmptyComponent={
          <EtatVide message="Aucun ticket. Signalez un problème pour contacter l'équipe technique." />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.navigate(`/(tabs)/plus/tickets/${item.id}`)}
          >
            <Carte>
              <View style={styles.entete}>
                <Text
                  style={[styles.titre, { color: t.text }]}
                  numberOfLines={1}
                >
                  {item.titre}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={t.textSecondary}
                />
              </View>
              <Text
                style={{ color: t.textSecondary, fontSize: 13 }}
                numberOfLines={2}
              >
                {item.description}
              </Text>
              <View style={styles.pied}>
                <Badge
                  texte={STATUT_TICKET_LABELS[item.statut]}
                  ton={tonStatut(item.statut)}
                />
                <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            </Carte>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  liste: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  entete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  titre: { fontSize: 15, fontWeight: "700", flex: 1 },
  pied: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
