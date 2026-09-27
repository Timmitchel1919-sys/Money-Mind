// Explicit, session-scoped opt-in to the legacy V1 presentation ("Classic view")
// while the V2 shell is enabled. Never persisted beyond the browser session, so
// a new session always starts in V2. Storage failures fall back to V2.

const KEY = "moneyMindPresentation"

export function readClassicViewPreference(storage = globalThis.sessionStorage) {
  try {
    return storage?.getItem(KEY) === "classic"
  } catch {
    return false
  }
}

export function writeClassicViewPreference(classic, storage = globalThis.sessionStorage) {
  try {
    if (classic) storage?.setItem(KEY, "classic")
    else storage?.removeItem(KEY)
  } catch {
    // The in-memory choice still applies for this page view.
  }
}
