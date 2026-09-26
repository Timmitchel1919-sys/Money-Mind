const OPEN_MONEY_AI_EVENT = "money-mind:open-ai"

/**
 * Opens the existing Money AI surface from a V2 spatial interaction.
 *
 * The scene deliberately does not import hooks, Firebase, or the Money AI
 * implementation. This small browser-event bridge keeps that boundary intact
 * while allowing a selected spatial domain to seed a useful question.
 */
export function openMoneyAIFromSpatial(question = "") {
  if (typeof window === "undefined") return

  window.dispatchEvent(new CustomEvent(OPEN_MONEY_AI_EVENT, {
    detail: { question: String(question || "") },
  }))
}

export { OPEN_MONEY_AI_EVENT }
