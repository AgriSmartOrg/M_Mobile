// Courbe d'historique des mesures (SVG pur, sans bibliothèque de graphiques).
// Ligne + aire dégradée, repères min/max/dernier point, axe temporel simplifié.

import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import Svg, {
  Defs,
  LinearGradient,
  Polygon,
  Polyline,
  Stop,
  Circle,
  Line,
} from "react-native-svg"

import { Spacing } from "@/constants/theme"
import { useTheme } from "@/hooks/use-theme"
import type { Mesure } from "@/lib/mesures"

const HAUTEUR = 160
const MARGE = 8

interface CourbeMesuresProps {
  mesures: Mesure[]
  unite?: string | null
}

function formatHeure(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}h`
}

export function CourbeMesures({ mesures, unite }: CourbeMesuresProps) {
  const t = useTheme()
  const [largeur, setLargeur] = useState(0)

  if (mesures.length < 2) {
    return (
      <View style={styles.vide}>
        <Text style={{ color: t.textSecondary, textAlign: "center" }}>
          Pas assez de mesures pour tracer une courbe.
        </Text>
      </View>
    )
  }

  const valeurs = mesures.map((m) => m.valeur)
  const min = Math.min(...valeurs)
  const max = Math.max(...valeurs)
  // Plage aplatie (valeurs constantes) : on élargit pour centrer la ligne.
  const plage = max - min || Math.abs(max) * 0.2 || 1

  const zoneLargeur = largeur - MARGE * 2
  const zoneHauteur = HAUTEUR - MARGE * 2

  const points = mesures.map((m, i) => {
    const x = MARGE + (i / (mesures.length - 1)) * zoneLargeur
    const y = MARGE + (1 - (m.valeur - min) / plage) * zoneHauteur
    return { x, y }
  })

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ")
  const polygone = `${MARGE},${HAUTEUR - MARGE} ${polyline} ${
    MARGE + zoneLargeur
  },${HAUTEUR - MARGE}`

  const dernier = points[points.length - 1]
  const derniereMesure = mesures[mesures.length - 1]
  const suffixe = unite ? ` ${unite}` : ""

  return (
    <View onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}>
      {/* En-tête : dernière valeur + bornes */}
      <View style={styles.entete}>
        <Text style={[styles.derniereValeur, { color: t.text }]}>
          {derniereMesure.valeur.toFixed(1)}
          {suffixe}
        </Text>
        <Text style={{ color: t.textSecondary, fontSize: 12 }}>
          min {min.toFixed(1)} · max {max.toFixed(1)}
        </Text>
      </View>

      {largeur > 0 ? (
        <Svg width={largeur} height={HAUTEUR}>
          <Defs>
            <LinearGradient id="aire" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t.primary} stopOpacity="0.25" />
              <Stop offset="1" stopColor={t.primary} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Lignes de repère haut / milieu / bas */}
          {[MARGE, HAUTEUR / 2, HAUTEUR - MARGE].map((y) => (
            <Line
              key={y}
              x1={MARGE}
              y1={y}
              x2={largeur - MARGE}
              y2={y}
              stroke={t.border}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
          ))}

          <Polygon points={polygone} fill="url(#aire)" />
          <Polyline
            points={polyline}
            fill="none"
            stroke={t.primary}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Circle
            cx={dernier.x}
            cy={dernier.y}
            r={4}
            fill={t.primary}
            stroke={t.card}
            strokeWidth={2}
          />
        </Svg>
      ) : (
        <View style={{ height: HAUTEUR }} />
      )}

      {/* Axe temporel : première et dernière mesure */}
      <View style={styles.axe}>
        <Text style={{ color: t.textSecondary, fontSize: 11 }}>
          {formatHeure(mesures[0].date)}
        </Text>
        <Text style={{ color: t.textSecondary, fontSize: 11 }}>
          {formatHeure(derniereMesure.date)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  entete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: Spacing.xs,
  },
  derniereValeur: { fontSize: 22, fontWeight: "800" },
  axe: { flexDirection: "row", justifyContent: "space-between" },
  vide: { paddingVertical: Spacing.lg },
})
