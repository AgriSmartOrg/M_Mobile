// Aide multipart : joindre un fichier local (URI expo-image-picker) à un
// FormData, sur toutes les plateformes.
//  - Natif (Android/iOS) : objet { uri, name, type } — convention React Native.
//  - Web : l'URI (blob:/data:) doit être convertie en Blob, sinon le fichier
//    part sous forme de texte "[object Object]" et l'upload échoue.

import { Platform } from "react-native"

export async function joindreFichier(
  form: FormData,
  champ: string,
  uri: string,
  mimeType: string,
  nom: string,
): Promise<void> {
  if (Platform.OS === "web") {
    const blob = await fetch(uri).then((r) => r.blob())
    form.append(champ, blob, nom)
    return
  }
  // @ts-expect-error — signature RN de FormData.append (objet fichier).
  form.append(champ, { uri, name: nom, type: mimeType })
}
