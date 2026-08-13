// Onglets principaux de l'application (utilisateur connecté).
// Le badge de l'onglet Alertes affiche le nombre d'alertes non résolues
// (rafraîchi toutes les 60 s — pas de temps réel nécessaire sur mobile).

import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { useEffect, useState } from "react"

import { useTheme } from "@/hooks/use-theme"
import { getAlertes } from "@/lib/alertes"

const REFRESH_BADGE_MS = 60_000

export default function TabsLayout() {
  const t = useTheme()
  const [nonResolues, setNonResolues] = useState(0)

  useEffect(() => {
    let actif = true

    async function compter() {
      try {
        const alertes = await getAlertes()
        if (actif) setNonResolues(alertes.filter((a) => !a.resolue).length)
      } catch {
        // silencieux — badge non critique
      }
    }

    void compter()
    const timer = setInterval(compter, REFRESH_BADGE_MS)
    return () => {
      actif = false
      clearInterval(timer)
    }
  }, [])

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parcelles"
        options={{
          title: "Parcelles",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="diagnostic"
        options={{
          title: "Diagnostic",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alertes"
        options={{
          title: "Alertes",
          tabBarBadge: nonResolues > 0 ? nonResolues : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: "Plus",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
