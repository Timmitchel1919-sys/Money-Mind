import { useCallback, useState } from "react"
import { generateAIResponse, isExternalAIEnabled } from "../services/aiService"
import { answerQuestion, detectLanguage } from "../utils/financialQuestionParser"

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const ERROR_TEXT = {
  en: "Something went wrong generating a response. Please try again.",
  nl: "Er ging iets mis bij het genereren van een antwoord. Probeer het opnieuw.",
}

// Deterministic, local-first conversation engine for Money AI. Financial
// data never leaves the browser unless an external provider is
// explicitly configured (see src/services/aiService.js) — this hook
// only ever reads financialContext, it never transmits it anywhere on
// its own.
export default function useMoneyAI(financialContext, languagePreference = "auto") {
  const [messages, setMessages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  const send = useCallback(
    async (question) => {
      const trimmed = (question || "").trim()
      if (!trimmed) return

      const detected = languagePreference === "auto" ? detectLanguage(trimmed) : languagePreference

      const userMessage = {
        id: makeId(),
        role: "user",
        text: trimmed,
        language: detected,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsProcessing(true)
      setError("")

      try {
        const result = await generateAIResponse({
          question: trimmed,
          language: detected,
          financialContext,
          answerLocally: answerQuestion,
        })

        const assistantMessage = {
          id: makeId(),
          role: "assistant",
          text: result.text,
          disclaimer: result.disclaimer || null,
          providerNote: result.providerNote || null,
          language: detected,
          timestamp: Date.now(),
          sourceQuestion: trimmed,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        setError(ERROR_TEXT[detected] || ERROR_TEXT.en)
      } finally {
        setIsProcessing(false)
      }
    },
    [financialContext, languagePreference]
  )

  function retryLast() {
    const lastUser = [...messages].reverse().find((message) => message.role === "user")
    if (lastUser) send(lastUser.text)
  }

  function clear() {
    setMessages([])
    setError("")
  }

  // Deterministic answers resolve almost instantly, so there is nothing
  // to actually interrupt — this simply lets the UI end the "processing"
  // state early if the user asks to stop.
  function stop() {
    setIsProcessing(false)
  }

  return {
    messages,
    isProcessing,
    error,
    send,
    retryLast,
    clear,
    stop,
    isExternalAIEnabled: isExternalAIEnabled(),
  }
}
