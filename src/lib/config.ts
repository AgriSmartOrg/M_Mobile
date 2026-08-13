// Configuration centralisée de l'application mobile.
//
// L'URL de base de l'API pointe vers le backend Spring Boot. Elle se règle
// via la variable d'environnement EXPO_PUBLIC_API_URL (fichier .env local,
// voir .env.example). À défaut :
//  - Android (émulateur) : 10.0.2.2 = le localhost de la machine hôte ;
//  - iOS / web : localhost.
// Sur un téléphone physique, EXPO_PUBLIC_API_URL doit contenir l'adresse IP
// locale de la machine qui exécute le backend (ex. http://192.168.1.20:8080).

import { Platform } from "react-native"

const FALLBACK =
  Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080"

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? FALLBACK

// Préfixe commun de toutes les routes de l'API (voir @RequestMapping côté Spring).
export const API_PREFIX = "/api"
