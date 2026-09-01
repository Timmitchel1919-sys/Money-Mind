import { TRANSITIONS } from "../core/motionState.js"

export function resolveEdgeMotion({ active, activeTransition, connectedToSelection, policy, progress, selectedId }) {
  const entry = activeTransition?.name === TRANSITIONS.entry && policy.id !== "off" ? progress : 1
  const opacity = selectedId ? (connectedToSelection ? 0.88 : 0.1) : active ? 0.68 : 0.32
  return Object.freeze({ color: connectedToSelection || active ? "#a9c8ef" : "#45617e", opacity: opacity * entry })
}
