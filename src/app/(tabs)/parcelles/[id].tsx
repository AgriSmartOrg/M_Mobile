// Détail d'une parcelle : tableau de bord (culture, alertes), historique en
// courbes, dispositifs installés et commande des actionneurs (ON/OFF + auto).
// L'état d'un actionneur est confirmé par l'ACK MQTT : après une commande,
// l'écran relit les actionneurs au bout de 3 secondes.

import { useCallback, useEffect, useState } from "react"
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { Badge, Bouton, Carte, Chargement, EtatVide, Ligne } from "@/components/ui"
import { CourbeMesures } from "@/components/courbe-mesures"
import { Radius, Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import {
  changerModeAuto,
  envoyerCommande,
  getActionneursByParcelle,
  TYPE_ACTIONNEUR_LABELS,
  type Actionneur,
} from "@/lib/actionneurs"
import { useAuth } from "@/lib/auth/use-auth"
import {
  getHistoriqueMesures,
  TYPES_HISTORIQUE,
  type Mesure,
  type TypeCapteur,
} from "@/lib/mesures"
import {
  ENVIRONNEMENT_LABELS,
  TYPE_SOL_LABELS,
  getDispositifsByParcelle,
  getTableauDeBordParcelle,
  type Dispositif,
  type TableauDeBordParcelle,
} from "@/lib/parcelles"

export default function ParcelleDetailScreen() {
  const t = useTheme()
  const { user } = useAuth()
  const estAdmin = user?.role === "ADMIN"
  const params = useLocalSearchParams<{ id: string }>()
  const parcelleId = Number(params.id)

  const [bord, setBord] = useState<TableauDeBordParcelle | null>(null)
  const [dispositifs, setDispositifs] = useState<Dispositif[]>([])
  const [actionneurs, setActionneurs] = useState<Actionneur[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState(false)
  const [rafraichissement, setRafraichissement] = useState(false)
  const [commandeEnCours, setCommandeEnCours] = useState<number | null>(null)

  // Historique en courbe : type de capteur sélectionné + série de mesures.
  const [typeHistorique, setTypeHistorique] =
    useState<TypeCapteur>("HUMIDITE_SOL")
  const [mesuresHistorique, setMesuresHistorique] = useState<Mesure[]>([])
  const [chargementHistorique, setChargementHistorique] = useState(false)

  const charger = useCallback(async () => {
    try {
      // Les actionneurs sont chargés par parcelle (un seul appel) ; leur
      // échec ne doit pas faire tomber tout l'écran.
      const [b, la] = await Promise.all([
        getTableauDeBordParcelle(parcelleId),
        getActionneursByParcelle(parcelleId).catch(() => [] as Actionneur[]),
      ])
      setBord(b)
      setActionneurs(la)
      setErreurChargement(false)
      // Les dispositifs (vue technique) sont réservés à l'ADMIN — 403
      // pour un AGRICULTEUR.
      if (estAdmin) {
        setDispositifs(
          await getDispositifsByParcelle(parcelleId).catch(
            () => [] as Dispositif[],
          ),
        )
      }
    } catch {
      // Erreur réseau ou session : données précédentes conservées.
      setErreurChargement(true)
    }
  }, [parcelleId, estAdmin])

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

  // Recharge la courbe quand le type sélectionné change.
  useEffect(() => {
    let actif = true
    setChargementHistorique(true)
    getHistoriqueMesures(parcelleId, typeHistorique)
      .then((mesures) => {
        if (actif) setMesuresHistorique(mesures)
      })
      .catch(() => {
        if (actif) setMesuresHistorique([])
      })
      .finally(() => {
        if (actif) setChargementHistorique(false)
      })
    return () => {
      actif = false
    }
  }, [parcelleId, typeHistorique])

  async function commander(a: Actionneur, etatDemande: boolean) {
    if (!user) return
    setCommandeEnCours(a.id)
    try {
      await envoyerCommande(a.id, {
        etatDemande,
        utilisateurId: user.utilisateurId,
      })
      Alert.alert(
        "Commande envoyée",
        `${a.nom} → ${etatDemande ? "activation" : "extinction"}. ` +
          "L'état sera confirmé par le dispositif.",
      )
      setTimeout(() => {
        void charger()
      }, 3000)
    } catch (e) {
      Alert.alert(
        "Échec",
        e instanceof Error ? e.message : "Commande impossible.",
      )
    } finally {
      setCommandeEnCours(null)
    }
  }

  async function basculerAuto(a: Actionneur) {
    try {
      const maj = await changerModeAuto(a.id, !a.modeAuto)
      setActionneurs((liste) => liste.map((x) => (x.id === maj.id ? maj : x)))
    } catch (e) {
      Alert.alert(
        "Échec",
        e instanceof Error ? e.message : "Changement de mode impossible.",
      )
    }
  }

  if (chargement) return <Chargement />
  if (!bord)
    return (
      <EtatVide
        message={
          erreurChargement
            ? "Impossible de charger la parcelle. Vérifiez votre connexion puis réessayez."
            : "Parcelle introuvable."
        }
      />
    )

  return (
    <>
      <Stack.Screen options={{ title: bord.parcelleNom }} />
      <ScrollView
        style={{ backgroundColor: t.background }}
        contentContainerStyle={styles.contenu}
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
        {/* ── Informations ── */}
        <Carte>
          <Text style={[styles.titre, { color: t.text }]}>Informations</Text>
          <Ligne libelle="Superficie" valeur={`${bord.superficie} m²`} />
          <Ligne libelle="Type de sol" valeur={TYPE_SOL_LABELS[bord.typeSol]} />
          <Ligne
            libelle="Environnement"
            valeur={ENVIRONNEMENT_LABELS[bord.environnement]}
          />
          {bord.parcelleDescription ? (
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>
              {bord.parcelleDescription}
            </Text>
          ) : null}
        </Carte>

        {/* ── Culture en cours ── */}
        <Carte>
          <Text style={[styles.titre, { color: t.text }]}>Culture en cours</Text>
          {bord.culture ? (
            <>
              <Ligne
                libelle="Culture"
                valeur={
                  bord.culture.typeCultureNom +
                  (bord.culture.typeCultureVariete
                    ? ` — ${bord.culture.typeCultureVariete}`
                    : "")
                }
              />
              <Ligne libelle="Saison" valeur={bord.culture.saison} />
              <Ligne
                libelle="Démarrée le"
                valeur={new Date(bord.culture.dateDebut).toLocaleDateString(
                  "fr-FR",
                )}
              />
            </>
          ) : (
            <Text style={{ color: t.textSecondary }}>
              Aucune culture en cours sur cette parcelle.
            </Text>
          )}
        </Carte>

        {/* ── Alertes récentes ── */}
        <Carte>
          <View style={styles.enteteSection}>
            <Text style={[styles.titre, { color: t.text }]}>Alertes</Text>
            <Badge
              texte={`${bord.totalAlertesNonResolues} non résolue(s)`}
              ton={bord.totalAlertesNonResolues > 0 ? "danger" : "primaire"}
            />
          </View>
          {bord.alertes.length === 0 ? (
            <Text style={{ color: t.textSecondary }}>
              Aucune alerte récente.
            </Text>
          ) : (
            bord.alertes.slice(0, 5).map((a) => (
              <View key={a.id} style={styles.alerteLigne}>
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
                <Text
                  style={{ color: t.text, flex: 1, fontSize: 13 }}
                  numberOfLines={2}
                >
                  {a.messageListible}
                </Text>
              </View>
            ))
          )}
        </Carte>

        {/* ── Historique en courbe ── */}
        <Carte>
          <Text style={[styles.titre, { color: t.text }]}>
            Historique des mesures
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.puces}
          >
            {TYPES_HISTORIQUE.map(({ type, label }) => {
              const actif = type === typeHistorique
              return (
                <Pressable
                  key={type}
                  onPress={() => setTypeHistorique(type)}
                  style={[
                    styles.puce,
                    {
                      backgroundColor: actif ? t.primaryMuted : t.background,
                      borderColor: actif ? t.primary : t.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: actif ? t.primary : t.textSecondary,
                      fontSize: 13,
                      fontWeight: actif ? "700" : "500",
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
          {chargementHistorique ? (
            <Text style={{ color: t.textSecondary }}>Chargement…</Text>
          ) : mesuresHistorique.length === 0 ? (
            <Text style={{ color: t.textSecondary }}>
              Aucune mesure de ce type sur cette parcelle.
            </Text>
          ) : (
            <CourbeMesures
              mesures={mesuresHistorique}
              unite={mesuresHistorique[0]?.capteurUnite}
            />
          )}
        </Carte>

        {/* ── Dispositifs (vue technique, ADMIN uniquement) ── */}
        {estAdmin ? (
          <Carte>
            <Text style={[styles.titre, { color: t.text }]}>Dispositifs</Text>
            {dispositifs.length === 0 ? (
              <Text style={{ color: t.textSecondary }}>
                Aucun dispositif installé.
              </Text>
            ) : (
              dispositifs.map((d) => (
                <View key={d.id} style={styles.dispositifLigne}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontWeight: "600" }}>
                      {d.nom}
                    </Text>
                    <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                      {d.adresseMac} · batterie {d.batteriePct}%
                    </Text>
                  </View>
                  <Badge
                    texte={d.statut === "ONLINE" ? "En ligne" : "Hors ligne"}
                    ton={d.statut === "ONLINE" ? "primaire" : "danger"}
                  />
                </View>
              ))
            )}
          </Carte>
        ) : null}

        {/* ── Actionneurs ── */}
        <Text style={[styles.sectionTitre, { color: t.text }]}>
          Actionneurs
        </Text>
        {actionneurs.length === 0 ? (
          <Carte>
            <Text style={{ color: t.textSecondary }}>
              Aucun actionneur sur cette parcelle.
            </Text>
          </Carte>
        ) : (
          actionneurs.map((a) => (
            <Carte key={a.id}>
              <View style={styles.enteteSection}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: "700" }}>
                    {a.nom}
                  </Text>
                  <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                    {TYPE_ACTIONNEUR_LABELS[a.type]}
                  </Text>
                </View>
                <Badge
                  texte={a.etatActuel ? "Allumé" : "Éteint"}
                  ton={a.etatActuel ? "primaire" : "neutre"}
                />
              </View>

              <Pressable
                onPress={() => basculerAuto(a)}
                style={styles.ligneAuto}
              >
                <Text style={{ color: t.textSecondary }}>
                  Régulation automatique
                </Text>
                <Ionicons
                  name={a.modeAuto ? "toggle" : "toggle-outline"}
                  size={28}
                  color={a.modeAuto ? t.primary : t.textSecondary}
                />
              </Pressable>

              <Bouton
                titre={a.etatActuel ? "Éteindre" : "Allumer"}
                variante={a.etatActuel ? "danger" : "primaire"}
                chargement={commandeEnCours === a.id}
                onPress={() => commander(a, !a.etatActuel)}
              />
            </Carte>
          ))
        )}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.md, gap: Spacing.sm },
  titre: { fontSize: 16, fontWeight: "700" },
  sectionTitre: { fontSize: 18, fontWeight: "700", marginTop: Spacing.sm },
  puces: { gap: Spacing.sm, paddingVertical: 2 },
  puce: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  enteteSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  alerteLigne: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  dispositifLigne: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  ligneAuto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
