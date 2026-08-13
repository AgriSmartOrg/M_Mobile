// Détail d'un ticket : statut, photos, rapport d'intervention éventuel,
// commentaires (lecture + ajout).

import { useCallback, useState } from "react"
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useFocusEffect, useLocalSearchParams } from "expo-router"

import { Badge, Bouton, Carte, Champ, Chargement, EtatVide, Ligne } from "@/components/ui"
import { Radius, Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import {
  ajouterCommentaire,
  getCommentaires,
  getTicket,
  STATUT_TICKET_LABELS,
  type CommentaireTicketResponse,
  type TicketResponse,
} from "@/lib/tickets"

export default function TicketDetailScreen() {
  const t = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const ticketId = Number(params.id)

  const [ticket, setTicket] = useState<TicketResponse | null>(null)
  const [commentaires, setCommentaires] = useState<CommentaireTicketResponse[]>([])
  const [nouveau, setNouveau] = useState("")
  const [chargement, setChargement] = useState(true)
  const [rafraichissement, setRafraichissement] = useState(false)
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(async () => {
    try {
      const [tk, cs] = await Promise.all([
        getTicket(ticketId),
        getCommentaires(ticketId),
      ])
      setTicket(tk)
      setCommentaires(cs)
    } catch {
      // Réseau indisponible.
    }
  }, [ticketId])

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

  async function envoyerCommentaire() {
    if (!nouveau.trim()) return
    setEnvoi(true)
    try {
      const c = await ajouterCommentaire(ticketId, nouveau.trim())
      setCommentaires((liste) => [...liste, c])
      setNouveau("")
    } catch {
      // silencieux
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) return <Chargement />
  if (!ticket) return <EtatVide message="Ticket introuvable." />

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.contenu}
      keyboardShouldPersistTaps="handled"
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
    >
      <Carte>
        <Text style={[styles.titre, { color: t.text }]}>{ticket.titre}</Text>
        <Badge texte={STATUT_TICKET_LABELS[ticket.statut]} ton="info" />
        <Text style={{ color: t.textSecondary }}>{ticket.description}</Text>
        <Ligne
          libelle="Créé le"
          valeur={new Date(ticket.createdAt).toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        />
        {ticket.parcelleNom ? (
          <Ligne libelle="Parcelle" valeur={ticket.parcelleNom} />
        ) : null}
        {ticket.technicienNom ? (
          <Ligne
            libelle="Technicien"
            valeur={`${ticket.technicienPrenom ?? ""} ${ticket.technicienNom}`}
          />
        ) : null}
        {ticket.motifRejet ? (
          <Ligne libelle="Motif du rejet" valeur={ticket.motifRejet} />
        ) : null}
      </Carte>

      {ticket.photos.length > 0 ? (
        <Carte>
          <Text style={[styles.sousTitre, { color: t.text }]}>Photos</Text>
          <View style={styles.photos}>
            {ticket.photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: p.url }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </View>
        </Carte>
      ) : null}

      {/* ── Commentaires ── */}
      <Text style={[styles.sousTitre, { color: t.text }]}>
        Commentaires ({commentaires.length})
      </Text>
      {commentaires.map((c) => (
        <Carte key={c.id}>
          <View style={styles.commentaireEntete}>
            <Text style={{ color: t.text, fontWeight: "600" }}>
              {c.auteurPrenom} {c.auteurNom}
            </Text>
            <Text style={{ color: t.textSecondary, fontSize: 11 }}>
              {new Date(c.createdAt).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </Text>
          </View>
          <Text style={{ color: t.textSecondary }}>{c.contenu}</Text>
        </Carte>
      ))}

      <Champ
        label="Ajouter un commentaire"
        value={nouveau}
        onChangeText={setNouveau}
        placeholder="Votre message…"
        multiline
      />
      <Bouton
        titre="Envoyer"
        onPress={envoyerCommentaire}
        chargement={envoi}
        desactive={!nouveau.trim()}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.md, gap: Spacing.sm },
  titre: { fontSize: 18, fontWeight: "700" },
  sousTitre: { fontSize: 16, fontWeight: "700", marginTop: Spacing.sm },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  photo: { width: 96, height: 96, borderRadius: Radius.sm },
  commentaireEntete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
