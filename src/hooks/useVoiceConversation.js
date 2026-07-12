import { useCallback, useEffect, useRef } from "react"
import useSpeechRecognition from "./useSpeechRecognition"
import { detectLanguage } from "../utils/financialQuestionParser"

const WAKE_PHRASES = {
  en: ["hey money ai", "money ai"],
  nl: ["hé money ai", "he money ai", "money ai"],
}

const ALL_WAKE_PHRASES = [...new Set([...WAKE_PHRASES.en, ...WAKE_PHRASES.nl])].sort((a, b) => b.length - a.length)

function stripWakePhrase(text) {
  const trimmed = text.trim()
  const lower = trimmed.toLowerCase()

  for (const phrase of ALL_WAKE_PHRASES) {
    if (lower.startsWith(phrase)) {
      const rest = trimmed.slice(phrase.length).trim().replace(/^[,:\-–]\s*/, "")
      return { matched: true, text: rest }
    }
  }

  return { matched: false, text: trimmed }
}

const MAX_NO_SPEECH_RETRIES = 3
const MAX_ERROR_RETRIES = 3
const RESTART_DELAY_MS = 800
const DUPLICATE_WINDOW_MS = 1500

// Orchestrates Push to Talk and Continuous Conversation on top of a
// single shared useSpeechRecognition instance. Off-mode dictation
// (mic populates the textarea without auto-sending) is exposed via
// onDictation so the page can keep using one mic button for all modes.
export default function useVoiceConversation({
  mode, // "off" | "pushToTalk" | "continuous"
  setMode,
  voiceLanguage, // "en-US" | "nl-NL"
  wakePhraseEnabled,
  autoSubmit,
  silenceTimeoutMs,
  moneyAI, // { messages, isProcessing, send }
  synthesis,
  onDictation,
}) {
  const modeRef = useRef(mode)
  const wakePhraseRef = useRef(wakePhraseEnabled)
  const autoSubmitRef = useRef(autoSubmit)
  const lastSubmittedRef = useRef({ text: "", time: 0 })
  const noSpeechCountRef = useRef(0)
  const errorCountRef = useRef(0)
  const speakingHandledIdRef = useRef(null)
  const prevSynthesisStatusRef = useRef("idle")
  const prevRecognitionStatusRef = useRef("idle")
  const restartTimerRef = useRef(null)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    wakePhraseRef.current = wakePhraseEnabled
  }, [wakePhraseEnabled])

  useEffect(() => {
    autoSubmitRef.current = autoSubmit
  }, [autoSubmit])

  const handleFinalTranscript = useCallback(
    (rawText) => {
      const trimmed = (rawText || "").trim()
      if (!trimmed) return

      // Duplicate-submission guard: identical final text arriving twice
      // in quick succession (a known SpeechRecognition quirk) is ignored.
      const now = Date.now()
      if (lastSubmittedRef.current.text === trimmed && now - lastSubmittedRef.current.time < DUPLICATE_WINDOW_MS) {
        return
      }

      const currentMode = modeRef.current

      if (currentMode === "off") {
        onDictation?.(trimmed)
        return
      }

      let finalText = trimmed

      if (currentMode === "continuous" && wakePhraseRef.current) {
        const { matched, text } = stripWakePhrase(trimmed)
        if (!matched) return
        finalText = text
      }

      if (!finalText) return

      if (!autoSubmitRef.current) {
        onDictation?.(finalText)
        return
      }

      lastSubmittedRef.current = { text: trimmed, time: now }
      noSpeechCountRef.current = 0
      errorCountRef.current = 0

      moneyAI.send(finalText)
    },
    [moneyAI, onDictation]
  )

  const recognition = useSpeechRecognition({
    language: voiceLanguage,
    onResult: handleFinalTranscript,
    silenceTimeoutMs,
  })

  // Continuous mode: after "no-speech" or a genuine error, retry a
  // limited number of times with a short delay, then give up and turn
  // voice mode off rather than looping forever with nobody talking.
  useEffect(() => {
    const prevStatus = prevRecognitionStatusRef.current
    prevRecognitionStatusRef.current = recognition.status

    if (mode !== "continuous" || prevStatus === recognition.status) return

    if (recognition.status === "no-speech") {
      noSpeechCountRef.current += 1
      if (noSpeechCountRef.current >= MAX_NO_SPEECH_RETRIES) {
        setMode("off")
        return
      }
      restartTimerRef.current = setTimeout(() => {
        if (modeRef.current === "continuous") recognition.start()
      }, RESTART_DELAY_MS)
    }

    if (recognition.status === "error" || recognition.status === "permission-denied") {
      errorCountRef.current += 1
      if (recognition.status === "permission-denied" || errorCountRef.current >= MAX_ERROR_RETRIES) {
        setMode("off")
      }
    }

    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
        restartTimerRef.current = null
      }
    }
  }, [recognition.status, mode, setMode, recognition])

  // Speak newly arrived assistant messages automatically while voice
  // mode is active (Push to Talk and Continuous both require this,
  // independent of the separate manual "Auto-read" chat toggle).
  const lastMessage = moneyAI.messages[moneyAI.messages.length - 1]
  useEffect(() => {
    if (mode === "off") return
    if (!lastMessage || lastMessage.role !== "assistant") return
    if (speakingHandledIdRef.current === lastMessage.id) return
    speakingHandledIdRef.current = lastMessage.id

    const language = voiceLanguage === "nl-NL" ? "nl" : detectLanguage(lastMessage.text)
    synthesis.speak(lastMessage.text, lastMessage.language || language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id, mode])

  // Continuous mode: once playback of the answer finishes, resume
  // listening automatically so the user never has to press anything.
  useEffect(() => {
    const prevStatus = prevSynthesisStatusRef.current
    prevSynthesisStatusRef.current = synthesis.status

    if (mode !== "continuous") return
    if (prevStatus === "speaking" && synthesis.status === "idle") {
      recognition.start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synthesis.status, mode])

  // Mode transitions: entering continuous starts listening immediately;
  // leaving voice mode entirely stops both recognition and playback.
  const prevModeRef = useRef(mode)
  useEffect(() => {
    const prevMode = prevModeRef.current
    prevModeRef.current = mode
    if (prevMode === mode) return

    noSpeechCountRef.current = 0
    errorCountRef.current = 0

    if (mode === "continuous") {
      recognition.start()
    } else if (mode === "off") {
      recognition.stop()
      synthesis.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Stop everything if the browser tab is backgrounded — never leave
  // the microphone listening in a hidden tab.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && modeRef.current !== "off") {
        setMode("off")
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [setMode])

  // Full cleanup on unmount (navigating away from Money AI, logout, or
  // any other unmount of this page).
  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      recognition.abort()
      synthesis.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const interruptAndAsk = useCallback(() => {
    synthesis.stop()
    recognition.start()
  }, [synthesis, recognition])

  const stopVoiceMode = useCallback(() => {
    setMode("off")
  }, [setMode])

  return {
    recognition,
    interruptAndAsk,
    stopVoiceMode,
  }
}
