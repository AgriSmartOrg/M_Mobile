// Pile de navigation de l'onglet « Plus » (profil, tickets).

import { Stack } from "expo-router"

export default function PlusLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Plus" }} />
      <Stack.Screen name="profil" options={{ title: "Mon profil" }} />
      <Stack.Screen name="tickets/index" options={{ title: "Mes tickets" }} />
      <Stack.Screen name="tickets/nouveau" options={{ title: "Nouveau ticket" }} />
      <Stack.Screen name="tickets/[id]" options={{ title: "Ticket" }} />
    </Stack>
  )
}
