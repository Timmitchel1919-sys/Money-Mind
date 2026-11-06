import { TRANSITIONS } from "../core/motionState.js"

// Chapter 7 visual-fidelity pass: warm gold edges (was slate blue) to match
// the reference's radial fan of gold connection lines on a teal-black scene.
// Resting and active are both gold; only opacity (and the connected/active
// brighter shade) carries the emphasis, so the reveal/selection behaviour below
// is unchanged.
export function resolveEdgeMotion({ active, activeTransition, connectedToSelection, policy, progress, selectedId }) {
  const entry = activeTransition?.name === TRANSITIONS.entry && policy.id !== "off" ? progress : 1
  const opacity = selectedId ? (connectedToSelection ? 0.88 : 0.1) : active ? 0.68 : 0.32
  return Object.freeze({ color: connectedToSelection || active ? "#f3cf8a" : "#8a7142", opacity: opacity * entry })
}
