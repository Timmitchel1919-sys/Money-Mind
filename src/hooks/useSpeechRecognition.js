import { useCallback, useEffect, useRef, useState } from "react"

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const DEFAULT_SILENCE_TIMEOUT_MS = 10000

// States: idle | listening | processing | permission-denied | no-speech | error | unsupported
export default function useSpeechRecognition({ language = "en-US", onResult, silenceTimeoutMs = DEFAULT_SILENCE_TIMEOUT_MS } = {}) {
  const RecognitionConstructor = getSpeechRecognitionConstructor()
  const [status, setStatus] = useState(RecognitionConstructor ? "idle" : "unsupported")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)
  const silenceTimerRef = useRef(null)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    if (!silenceTimeoutMs) return
    silenceTimerRef.current = setTimeout(() => {
      setStatus("no-speech")
      try {
        recognitionRef.current?.stop()
      } catch {
        // no-op
      }
    }, silenceTimeoutMs)
  }, [silenceTimeoutMs, clearSilenceTimer])

  useEffect(() => {
    if (!RecognitionConstructor) return

    const recognition = new RecognitionConstructor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language

    recognition.onstart = () => {
      setStatus("listening")
      setInterimTranscript("")
      setFinalTranscript("")
      setErrorMessage("")
      armSilenceTimer()
    }

    recognition.onresult = (event) => {
      clearSilenceTimer()

      let interim = ""
      let final = ""
      for (let i = 0; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) final += chunk
        else interim += chunk
      }

      setInterimTranscript(interim)

      if (final) {
        setFinalTranscript(final)
        setStatus("processing")
        onResultRef.current?.(final)
      } else {
        armSilenceTimer()
      }
    }

    recognition.onerror = (event) => {
      clearSilenceTimer()
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setStatus("permission-denied")
      } else if (event.error === "no-speech") {
        setStatus("no-speech")
      } else {
        setStatus("error")
      }
      setErrorMessage(event.error || "unknown-error")
    }

    recognition.onend = () => {
      clearSilenceTimer()
      setStatus((prev) => (prev === "listening" || prev === "processing" ? "idle" : prev))
    }

    recognitionRef.current = recognition

    return () => {
      clearSilenceTimer()
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {
        // recognition may not have started yet — safe to ignore
      }
    }
  }, [language, RecognitionConstructor, armSilenceTimer, clearSilenceTimer])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setInterimTranscript("")
    setFinalTranscript("")
    setErrorMessage("")
    try {
      recognitionRef.current.start()
    } catch {
      // start() throws if a session is already active — safe to ignore
    }
  }, [])

  // Graceful stop — finalizes whatever speech was already captured.
  const stop = useCallback(() => {
    clearSilenceTimer()
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {
      // no-op
    }
  }, [clearSilenceTimer])

  // Hard cancel — discards the in-progress session without finalizing
  // (used for the "Cancel" recording control).
  const abort = useCallback(() => {
    clearSilenceTimer()
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.abort()
    } catch {
      // no-op
    }
    setInterimTranscript("")
    setFinalTranscript("")
    setStatus("idle")
  }, [clearSilenceTimer])

  return {
    isSupported: Boolean(RecognitionConstructor),
    status,
    transcript: finalTranscript || interimTranscript,
    interimTranscript,
    finalTranscript,
    errorMessage,
    start,
    stop,
    abort,
  }
}
