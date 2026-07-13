import { httpsCallable } from "firebase/functions"
import { functions } from "../firebase"

// Calls the moneyAIVoiceSynthesize Cloud Function (functions/index.js),
// which holds the OpenAI API key server-side. Returns a playable object
// URL for the synthesized speech; caller is responsible for revoking it
// (URL.revokeObjectURL) once playback ends.
export async function synthesizeOpenAIVoice(text, voice) {
  const call = httpsCallable(functions, "moneyAIVoiceSynthesize")
  const result = await call({ text, voice })
  const { audioBase64, mimeType } = result.data || {}
  if (!audioBase64) throw new Error("No audio returned from voice synthesis.")

  const byteCharacters = atob(audioBase64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType || "audio/mpeg" })
  return URL.createObjectURL(blob)
}
