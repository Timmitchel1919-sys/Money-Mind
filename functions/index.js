const { onCall, HttpsError } = require("firebase-functions/v2/https")
const { defineSecret } = require("firebase-functions/params")

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY")

// Keep in sync with src/constants/openaiVoices.js.
const ALLOWED_VOICES = new Set([
  "alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse",
])

const MAX_CHARS = 2000

// Server-side only: the OpenAI key never reaches the client. The frontend
// calls this callable via firebase/functions; Firebase Auth verifies the
// caller automatically (request.auth is null for signed-out callers).
exports.moneyAIVoiceSynthesize = onCall({ secrets: [OPENAI_API_KEY], region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.")
  }

  const text = String(request.data?.text || "").trim()
  if (!text) {
    throw new HttpsError("invalid-argument", "text is required.")
  }
  if (text.length > MAX_CHARS) {
    throw new HttpsError("invalid-argument", `text exceeds ${MAX_CHARS} characters.`)
  }

  const requestedVoice = String(request.data?.voice || "")
  const voice = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : "nova"

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      response_format: "mp3",
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new HttpsError("internal", `OpenAI TTS request failed (${response.status}): ${errorText.slice(0, 300)}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const audioBase64 = Buffer.from(arrayBuffer).toString("base64")

  return { audioBase64, mimeType: "audio/mpeg" }
})
