// Voices offered by OpenAI's text-to-speech API (gpt-4o-mini-tts). Curated
// subset presented in Settings → Money AI Voice when the OpenAI engine is
// selected — all professional, human-sounding voices (vs. the free but
// often robotic OS voices used by the Browser engine).
export const OPENAI_VOICES = [
  { id: "nova", label: "Nova", description: "Warm, professional female voice" },
  { id: "shimmer", label: "Shimmer", description: "Bright, expressive female voice" },
  { id: "coral", label: "Coral", description: "Friendly, upbeat female voice" },
  { id: "sage", label: "Sage", description: "Calm, measured, thoughtful voice" },
  { id: "echo", label: "Echo", description: "Confident, conversational male voice" },
  { id: "onyx", label: "Onyx", description: "Deep, authoritative male voice" },
  { id: "ash", label: "Ash", description: "Smooth, professional male voice" },
  { id: "fable", label: "Fable", description: "Warm, storytelling voice" },
  { id: "ballad", label: "Ballad", description: "Expressive, emotive voice" },
  { id: "verse", label: "Verse", description: "Natural, conversational voice" },
  { id: "alloy", label: "Alloy", description: "Neutral, balanced all-purpose voice" },
]

export const DEFAULT_OPENAI_VOICE = "nova"

export function getOpenAIVoice(id) {
  return OPENAI_VOICES.find((voice) => voice.id === id) || OPENAI_VOICES.find((voice) => voice.id === DEFAULT_OPENAI_VOICE)
}
