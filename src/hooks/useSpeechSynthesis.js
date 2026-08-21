import { useCallback, useEffect, useRef, useState } from "react"
import { DEFAULT_OPENAI_VOICE } from "../constants/openaiVoices"
import { synthesizeOpenAIVoice } from "../services/openaiVoiceService"

const STORAGE_KEY = "moneyMindVoicePrefs"

const DEFAULT_PREFS = {
  rate: 0.95,
  pitch: 0.9,
  volume: 1.0,
  autoRead: false,
  voiceURIByLang: { en: null, nl: null },
  engine: "openai", // "browser" | "openai" — OpenAI's premium voices are the
  // professional, non-robotic default; "browser" (free OS/Google/Microsoft
  // voices) remains available as a fallback/opt-out in Settings.
  openaiVoice: DEFAULT_OPENAI_VOICE,
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
// auto-read, chosen voice per language, engine) persist in localStorage.
// Two engines: "browser" (free, uses the OS/browser's Web Speech API) and
// "openai" (paid, human-sounding voices via the moneyAIVoiceSynthesize
// Cloud Function — see functions/index.js). Both share the same
// speak/pause/resume/stop surface so callers never branch on engine.
export default function useSpeechSynthesis() {
  const browserSupported = isSynthesisSupported()
  const [voices, setVoices] = useState([])
  const [prefs, setPrefs] = useState(loadPrefs)
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState(null)
  const audioRef = useRef(null)

  const isOpenAI = prefs.engine === "openai"
  const supported = isOpenAI ? typeof Audio !== "undefined" : browserSupported

  useEffect(() => {
    if (!browserSupported) return

    function loadVoices() {
      setVoices(window.speechSynthesis.getVoices())
    }

    loadVoices()
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
  }, [browserSupported])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  function stopAudioElement() {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    if (audio.src) URL.revokeObjectURL(audio.src)
    audioRef.current = null
  }

  // Always cancel any in-flight speech when unmounting (component
  // unmount, navigating away from Money AI, logout — all unmount this
  // page) so speech never keeps playing after the page is gone.
  useEffect(() => {
    return () => {
      if (browserSupported) window.speechSynthesis.cancel()
      stopAudioElement()
    }
  }, [browserSupported])

  const speakBrowser = useCallback(
    (text, language) => {
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
    [voices, prefs]
  )

  const speakOpenAI = useCallback(
    async (text) => {
      stopAudioElement()
      setError(null)
      setStatus("speaking")

      try {
        const url = await synthesizeOpenAIVoice(text, prefs.openaiVoice)
        const audio = new Audio(url)
        audio.volume = prefs.volume
        audio.playbackRate = prefs.rate

        audio.onended = () => setStatus("idle")
        audio.onerror = () => {
          setStatus("idle")
          setError("Voice playback failed.")
        }

        audioRef.current = audio
        await audio.play()
      } catch (err) {
        setStatus("idle")
        setError(err?.message || "Voice synthesis failed.")
      }
    },
    [prefs.openaiVoice, prefs.volume, prefs.rate]
  )

  const speak = useCallback(
    (text, language = "en") => {
      if (!supported || !text) return
      if (isOpenAI) {
        speakOpenAI(text)
      } else {
        speakBrowser(text, language)
      }
    },
    [supported, isOpenAI, speakOpenAI, speakBrowser]
  )

  const pause = useCallback(() => {
    if (!supported) return
    if (isOpenAI) {
      audioRef.current?.pause()
    } else {
      window.speechSynthesis.pause()
    }
    setStatus("paused")
  }, [supported, isOpenAI])

  const resume = useCallback(() => {
    if (!supported) return
    if (isOpenAI) {
      audioRef.current?.play()
    } else {
      window.speechSynthesis.resume()
    }
    setStatus("speaking")
  }, [supported, isOpenAI])

  // Hard stop, used for Stop, barge-in/interrupt, page unmount, logout,
  // and disabling voice mode.
  const stop = useCallback(() => {
    if (!supported) return
    if (isOpenAI) {
      stopAudioElement()
    } else {
      window.speechSynthesis.cancel()
    }
    setStatus("idle")
  }, [supported, isOpenAI])

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
    error,
    prefs,
    speak,
    pause,
    resume,
    stop,
    updatePref,
    updateVoiceForLanguage,
  }
}
