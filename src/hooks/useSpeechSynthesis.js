import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "moneyMindVoicePrefs"

const DEFAULT_PREFS = {
  rate: 0.95,
  pitch: 0.9,
  volume: 1.0,
  autoRead: false,
  voiceURIByLang: { en: null, nl: null },
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return DEFAULT_PREFS
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      voiceURIByLang: { ...DEFAULT_PREFS.voiceURIByLang, ...(parsed.voiceURIByLang || {}) },
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function isSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

// Voice selection: prefer a male voice matching the answer's language;
// fall back to any voice in that language, then the system default,
// then simply the first available voice. Never throws if voices are
// empty — browser voice lists load asynchronously and vary by OS.
function pickBestVoice(voices, language) {
  if (!voices.length) return null

  const langPrefix = language === "nl" ? "nl" : "en"
  const inLanguage = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(langPrefix))

  const maleHints = ["male", "man", "david", "mark", "daniel", "fred", "arthur", "ruben", "xander", "george"]
  const male = inLanguage.find((voice) => maleHints.some((hint) => voice.name.toLowerCase().includes(hint)))

  return male || inLanguage[0] || voices.find((voice) => voice.default) || voices[0] || null
}

// States: idle | speaking | paused. Preferences (rate, pitch, volume,
// auto-read, chosen voice per language) persist in localStorage.
export default function useSpeechSynthesis() {
  const supported = isSynthesisSupported()
  const [voices, setVoices] = useState([])
  const [prefs, setPrefs] = useState(loadPrefs)
  const [status, setStatus] = useState("idle")

  useEffect(() => {
    if (!supported) return

    function loadVoices() {
      setVoices(window.speechSynthesis.getVoices())
    }

    loadVoices()
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
  }, [supported])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  // Always cancel any in-flight utterance when unmounting (component
  // unmount, navigating away from Money AI, logout — all unmount this
  // page) so speech never keeps playing after the page is gone.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  const speak = useCallback(
    (text, language = "en") => {
      if (!supported || !text) return

      window.speechSynthesis.cancel()

      const langKey = language === "nl" ? "nl" : "en"
      const preferredURI = prefs.voiceURIByLang[langKey]
      const preferredVoice = preferredURI
        ? voices.find((voice) => voice.voiceURI === preferredURI && voice.lang?.toLowerCase().startsWith(langKey))
        : null
      const voice = preferredVoice || pickBestVoice(voices, language)

      const utterance = new SpeechSynthesisUtterance(text)
      if (voice) utterance.voice = voice
      utterance.lang = voice?.lang || (language === "nl" ? "nl-NL" : "en-US")
      utterance.rate = prefs.rate
      utterance.pitch = prefs.pitch
      utterance.volume = prefs.volume

      utterance.onstart = () => setStatus("speaking")
      utterance.onend = () => setStatus("idle")
      utterance.onerror = () => setStatus("idle")

      window.speechSynthesis.speak(utterance)
    },
    [supported, voices, prefs]
  )

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    setStatus("paused")
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.resume()
    setStatus("speaking")
  }, [supported])

  // Hard stop, used for Stop, barge-in/interrupt, page unmount, logout,
  // and disabling voice mode.
  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setStatus("idle")
  }, [supported])

  function updatePref(key, value) {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  function updateVoiceForLanguage(language, voiceURI) {
    const langKey = language === "nl" ? "nl" : "en"
    setPrefs((prev) => ({
      ...prev,
      voiceURIByLang: { ...prev.voiceURIByLang, [langKey]: voiceURI || null },
    }))
  }

  return {
    isSupported: supported,
    voices,
    status,
    prefs,
    speak,
    pause,
    resume,
    stop,
    updatePref,
    updateVoiceForLanguage,
  }
}
