// Money AI provider layer.
//
// This module never holds a paid-provider API key. Vite only exposes
// variables prefixed VITE_ to client bundles (import.meta.env.VITE_*),
// so anything placed there is visible to anyone who opens devtools —
// which means a real key must NEVER be stored this way. At most,
// VITE_MONEY_AI_PROVIDER acts as a feature flag naming which provider is
// configured server-side.
//
// A production integration should call a secure backend (a Firebase
// Cloud Function, for example) that holds the actual provider key and
// proxies the request — the browser should only ever talk to that
// function, never directly to a paid AI API.

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

// generateAIResponse({ question, language, financialContext, answerLocally })
//
// answerLocally is injected by the caller (financialQuestionParser's
// answerQuestion) so this module stays free of app-specific financial
// logic and can be swapped for a real provider without touching the
// rules engine.
export async function generateAIResponse({ question, language, financialContext, answerLocally }) {
  if (!isExternalAIEnabled()) {
    return answerLocally({ question, language, financialContext })
  }

  // No external provider is wired up yet in this build. When one is
  // added, this branch should call the secure backend proxy described
  // above — never a paid API directly from the browser — and fall back
  // to the local engine on any failure so Money AI never goes silent.
  try {
    throw new Error("External AI provider is not connected yet.")
  } catch {
    const fallback = answerLocally({ question, language, financialContext })
    return {
      ...fallback,
      providerNote:
        language === "nl"
          ? "Externe AI is geconfigureerd maar nog niet verbonden — lokaal antwoord getoond."
          : "External AI is configured but not yet connected — showing the local answer instead.",
    }
  }
}
