// Money AI provider layer.
//
// This module never holds a paid-provider API key. Vite only exposes
// variables prefixed VITE_ to client bundles (import.meta.env.VITE_*),
// so anything placed there is visible to anyone who opens devtools —
// which means a real key must NEVER be stored this way. At most,
// VITE_MONEY_AI_PROVIDER acts as a feature flag naming which provider is
// configured server-side.
//
// When enabled, this calls the `agentQuery` Firebase Cloud Function
// (functions/index.js), which holds the real OpenAI key server-side,
// re-reads the user's financial data straight from Firestore (never
// trusting whatever the client happens to have in memory), and returns
// a generated answer. The browser never talks to OpenAI directly.
import { httpsCallable } from "firebase/functions"
import { functions } from "../firebase"

const PROVIDER = (typeof import.meta !== "undefined" && import.meta.env?.VITE_MONEY_AI_PROVIDER) || "local"

export function isExternalAIEnabled() {
  return Boolean(PROVIDER) && PROVIDER !== "local"
}

export function getAIProviderStatus(language = "en") {
  if (isExternalAIEnabled()) {
    return language === "nl" ? "Externe AI ingeschakeld" : "External AI enabled"
  }
  return language === "nl" ? "Lokale analyse" : "Local analysis"
}

const FALLBACK_NOTE = {
  en: "Money AI's live connection is temporarily unavailable — showing the local answer instead.",
  nl: "Money AI's live-verbinding is tijdelijk niet beschikbaar — lokaal antwoord getoond in plaats daarvan.",
}

// generateAIResponse({ question, language, financialContext, answerLocally, conversationId, recentMessages })
//
// answerLocally is injected by the caller (financialQuestionParser's
// answerQuestion) so this module stays free of app-specific financial
// logic and can be swapped for a real provider without touching the
// rules engine. financialContext is only used here to read the user's
// preferred currency (financialContext.settings.currency) — the actual
// financial figures sent to the model are re-fetched server-side from
// Firestore, not taken from the client.
export async function generateAIResponse({
  question,
  language,
  financialContext,
  answerLocally,
  conversationId,
  recentMessages,
}) {
  if (!isExternalAIEnabled()) {
    return answerLocally({ question, language, financialContext })
  }

  try {
    const agentQuery = httpsCallable(functions, "agentQuery")

    const response = await agentQuery({
      message: question,
      language,
      currency: financialContext?.settings?.currency,
      conversationId,
      recentMessages: Array.isArray(recentMessages)
        ? recentMessages.map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.text,
          }))
        : [],
    })

    const data = response.data || {}
    if (!data.success || !data.answer) {
      throw new Error("agentQuery returned no answer.")
    }

    return {
      text: data.answer,
      disclaimer: Array.isArray(data.warnings) ? data.warnings.join(" ") : null,
      providerNote: null,
    }
  } catch (error) {
    const fallback = answerLocally({ question, language, financialContext })
    return {
      ...fallback,
      providerNote: `${FALLBACK_NOTE[language] || FALLBACK_NOTE.en} (${error?.message || "unknown error"})`,
    }
  }
}
