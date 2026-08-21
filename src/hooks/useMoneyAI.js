import { useCallback, useEffect, useRef, useState } from "react"
import { generateAIResponse, isExternalAIEnabled } from "../services/aiService"
import { answerQuestion, detectLanguage } from "../utils/financialQuestionParser"
import { loadUserCollection, addUserDocument, clearUserCollection } from "../services/firestoreService"

const HISTORY_COLLECTION = "moneyAIMessages"

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
//
// Chat history persists to Firestore (users/{userId}/moneyAIMessages) so
// it survives refreshes and follows the account across devices. When
// userId is not yet available (still loading auth), the conversation
// simply behaves in-memory only, same as before this was added.
export default function useMoneyAI(financialContext, languagePreference = "auto", userId) {
  const [messages, setMessages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(userId))
  const [error, setError] = useState("")
  const conversationIdRef = useRef(makeId())
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    if (!userId) {
      setIsLoadingHistory(false)
      return
    }

    let cancelled = false
    setIsLoadingHistory(true)

    loadUserCollection(userId, HISTORY_COLLECTION)
      .then((docs) => {
        if (cancelled) return
        // loadUserCollection orders newest-first (createdAt desc); a
        // conversation transcript reads oldest-first.
        const chronological = [...docs].reverse()
        setMessages(chronological)

        const lastConversationId = chronological[chronological.length - 1]?.conversationId
        if (lastConversationId) conversationIdRef.current = lastConversationId
      })
      .catch(() => {
        // History failed to load (offline, permissions, etc.) — start a
        // fresh in-memory conversation rather than blocking Money AI.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

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
        conversationId: conversationIdRef.current,
      }

      setMessages((prev) => [...prev, userMessage])
      if (userId) addUserDocument(userId, HISTORY_COLLECTION, userMessage).catch(() => {})

      setIsProcessing(true)
      setError("")

      try {
        const result = await generateAIResponse({
          question: trimmed,
          language: detected,
          financialContext,
          answerLocally: answerQuestion,
          conversationId: conversationIdRef.current,
          recentMessages: messagesRef.current.slice(-10),
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
          conversationId: conversationIdRef.current,
        }

        setMessages((prev) => [...prev, assistantMessage])
        if (userId) addUserDocument(userId, HISTORY_COLLECTION, assistantMessage).catch(() => {})
      } catch {
        setError(ERROR_TEXT[detected] || ERROR_TEXT.en)
      } finally {
        setIsProcessing(false)
      }
    },
    [financialContext, languagePreference, userId]
  )

  function retryLast() {
    const lastUser = [...messages].reverse().find((message) => message.role === "user")
    if (lastUser) send(lastUser.text)
  }

  function clear() {
    setMessages([])
    setError("")
    conversationIdRef.current = makeId()
    if (userId) clearUserCollection(userId, HISTORY_COLLECTION).catch(() => {})
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
    isLoadingHistory,
    error,
    send,
    retryLast,
    clear,
    stop,
    isExternalAIEnabled: isExternalAIEnabled(),
  }
}
