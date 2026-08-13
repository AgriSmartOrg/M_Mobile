// Pile de navigation du domaine Parcelles (liste → détail).

import { Stack } from "expo-router"

export default function ParcellesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Mes parcelles" }} />
      <Stack.Screen name="[id]" options={{ title: "Parcelle" }} />
    </Stack>
  )
}
