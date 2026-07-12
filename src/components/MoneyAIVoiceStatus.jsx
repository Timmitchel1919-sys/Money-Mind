import { AlertTriangle, Mic, MicOff, Pause, Volume2 } from "lucide-react"

const LABELS = {
  off: { en: "Voice mode off", nl: "Spraakmodus uit" },
  ready: { en: "Ready", nl: "Klaar" },
  listening: { en: "Listening…", nl: "Aan het luisteren…" },
  speechDetected: { en: "Speech detected", nl: "Spraak gedetecteerd" },
  processing: { en: "Processing…", nl: "Verwerken…" },
  speaking: { en: "Money AI is speaking…", nl: "Money AI spreekt…" },
  paused: { en: "Paused", nl: "Gepauzeerd" },
  permissionDenied: { en: "Microphone permission denied", nl: "Microfoontoegang geweigerd" },
  unsupportedRecognition: { en: "Voice recognition unavailable", nl: "Spraakherkenning niet beschikbaar" },
  unsupportedSynthesis: { en: "Speech playback unavailable", nl: "Spraakweergave niet beschikbaar" },
  error: { en: "Connection error", nl: "Verbindingsfout" },
  noSpeech: { en: "No speech detected.", nl: "Geen spraak gedetecteerd." },
}

function resolveStatusKey({
  mode,
  recognitionStatus,
  interimTranscript,
  isProcessing,
  synthesisStatus,
  recognitionSupported,
  synthesisSupported,
}) {
  if (synthesisStatus === "speaking") return "speaking"
  if (synthesisStatus === "paused") return "paused"
  if (recognitionStatus === "permission-denied") return "permissionDenied"
  if (isProcessing) return "processing"
  if (recognitionStatus === "listening" && interimTranscript.trim()) return "speechDetected"
  if (recognitionStatus === "listening") return "listening"
  if (recognitionStatus === "no-speech") return "noSpeech"
  if (recognitionStatus === "error") return "error"
  if (mode === "off") return "off"
  if (!recognitionSupported) return "unsupportedRecognition"
  if (!synthesisSupported) return "unsupportedSynthesis"
  return "ready"
}

// Composite voice status indicator. Wrapped in role="status" + aria-live
// so screen readers announce listening/processing/speaking/error
// transitions without the user needing to look at the screen — important
// for a feature that is meant to be usable hands-free.
export default function MoneyAIVoiceStatus({
  mode,
  recognitionStatus,
  interimTranscript = "",
  isProcessing,
  synthesisStatus,
  recognitionSupported,
  synthesisSupported,
  language = "en",
}) {
  const key = resolveStatusKey({
    mode,
    recognitionStatus,
    interimTranscript,
    isProcessing,
    synthesisStatus,
    recognitionSupported,
    synthesisSupported,
  })

  const label = LABELS[key]?.[language] || LABELS[key]?.en || ""
  const isListening = key === "listening" || key === "speechDetected"
  const isSpeaking = key === "speaking"
  const isAlert = key === "permissionDenied" || key === "unsupportedRecognition" || key === "unsupportedSynthesis" || key === "error"

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-3"
      role="status"
      aria-live="polite"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
          isAlert
            ? "border-[#F87171]/40 bg-[#F87171]/10 text-[#F87171]"
            : isListening
            ? "border-[#3aaf90]/40 bg-[#3aaf90]/10 text-[#3aaf90]"
            : isSpeaking
            ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6]"
            : "border-[#BFC4CC]/25 bg-white/5 text-[#A5ADB8]"
        }`}
      >
        {isAlert ? (
          <AlertTriangle size={16} />
        ) : isSpeaking ? (
          <Volume2 size={16} />
        ) : key === "paused" ? (
          <Pause size={16} />
        ) : !recognitionSupported ? (
          <MicOff size={16} />
        ) : (
          <Mic size={16} className={isListening ? "animate-pulse" : ""} />
        )}
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#D5D8DD]">{label}</p>

        {isListening && (
          <div className="mt-1 flex items-center gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className="moneyai-waveform-bar h-3 w-0.5 rounded-full bg-[#3aaf90]/70"
                style={{ animationDelay: `${bar * 0.12}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
