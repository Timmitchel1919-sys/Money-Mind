import { TRANSITIONS } from "../core/motionState.js"
import { resolveRadialTarget } from "../radial/radialMotion.js"

export function resolveEntryProgress({ activeTransition, index, policy, progress }) {
  if (activeTransition?.name !== TRANSITIONS.entry || policy.id === "off") return 1
  const delay = index === 0 ? 0 : (index - 1) * policy.stagger
  const available = Math.max(1, activeTransition.duration - delay)
  return Math.min(1, Math.max(0, (progress * activeTransition.duration - delay) / available))
}

export function resolveNodeMotion({ activeTransition, hovered, index, kind, policy, progress, revealed = true, selected, selectedId }) {
  const isChild = kind === "child"

  // Layer 5: a child node is collapsed into its parent until that parent (or the
  // child itself) is selected. Child motion is independent of the Layer 3 radial
  // contraction, so core/radial output below is unchanged.
  if (isChild && !revealed) {
    return Object.freeze({ emissive: 0.15, opacity: 0, radialScale: 1, scale: 0.0001 })
  }

  const baseScale = kind === "core" ? 1 : isChild ? 0.4 : 0.58
  const muted = Boolean(selectedId && !selected && kind !== "core" && !isChild)
  const entry = resolveEntryProgress({ activeTransition, index, policy, progress })
  const radialTarget = resolveRadialTarget(null, selectedId)
  const emphasis = selected ? 1 + 0.38 * policy.scaleTravel : hovered ? 1 + 0.1 * policy.scaleTravel : 1
  const contextualScale = kind === "core" && selectedId ? 1 - 0.28 * policy.scaleTravel : 1
  const entryScale = isChild ? 1 : 0.72 + entry * 0.28
  const radialScale = isChild ? 1 : activeTransition?.name === TRANSITIONS.entry ? 0.72 + entry * 0.28 : radialTarget.radiusScale
  return Object.freeze({ emissive: selected ? 1.08 : hovered ? 0.78 : kind === "core" && selectedId ? 0.5 : 0.38, opacity: isChild ? 1 : entry * (muted ? 0.3 : kind === "core" && selectedId ? 0.72 : 1), radialScale, scale: baseScale * emphasis * contextualScale * entryScale })
}
