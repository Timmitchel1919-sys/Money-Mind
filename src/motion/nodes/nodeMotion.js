import { TRANSITIONS } from "../core/motionState.js"
import { resolveRadialTarget } from "../radial/radialMotion.js"

export function resolveEntryProgress({ activeTransition, index, policy, progress }) {
  if (activeTransition?.name !== TRANSITIONS.entry || policy.id === "off") return 1
  const delay = index === 0 ? 0 : (index - 1) * policy.stagger
  const available = Math.max(1, activeTransition.duration - delay)
  return Math.min(1, Math.max(0, (progress * activeTransition.duration - delay) / available))
}

// Chapter 7 (Spatial Financial Universe): hover spotlight. While a node is
// hovered, it is the active financial object and every other visible node dims
// (never to black). Deterministic visual priority, highest first:
//   1. hovered node          -> brightest, strongest emissive
//   2. selected node         -> bright; stays above dimmed nodes while another is hovered
//   3. core (not hovered)    -> dominant at rest, dims under another node's hover
//   4. other nodes           -> normal at rest, dimmed under hover
// Hover never changes selection (selection stays the Layer 3 selectNode intent).
// Values are targets; SpatialNode damps toward them with the active motion
// policy (off = instant), so no separate animation loop exists.
// `opacity` caps the node's opacity: on the dark scene it also darkens the
// clearcoat/specular reflections, which a colour multiplier alone cannot.
const SPOTLIGHT = Object.freeze({
  hovered: Object.freeze({ emissive: 1.9, brightness: 1.45, opacity: 1 }),
  selected: Object.freeze({ emissive: 1.08, brightness: 1.12, opacity: 1 }),
  selectedUnderHover: Object.freeze({ emissive: 0.82, brightness: 0.95, opacity: 0.85 }),
  core: Object.freeze({ emissive: 0.62, brightness: 1, opacity: 1 }),
  coreWithSelection: Object.freeze({ emissive: 0.5, brightness: 1, opacity: 1 }),
  coreUnderHover: Object.freeze({ emissive: 0.3, brightness: 0.62, opacity: 0.7 }),
  rest: Object.freeze({ emissive: 0.42, brightness: 1, opacity: 1 }),
  dimmed: Object.freeze({ emissive: 0.1, brightness: 0.4, opacity: 0.55 }),
})
export const NODE_SPOTLIGHT = SPOTLIGHT

function spotlightTier({ hovered, hoveredId, kind, selected, selectedId }) {
  const otherHovered = Boolean(hoveredId) && !hovered
  if (hovered) return SPOTLIGHT.hovered
  if (selected) return otherHovered ? SPOTLIGHT.selectedUnderHover : SPOTLIGHT.selected
  if (kind === "core") return otherHovered ? SPOTLIGHT.coreUnderHover : selectedId ? SPOTLIGHT.coreWithSelection : SPOTLIGHT.core
  return otherHovered ? SPOTLIGHT.dimmed : SPOTLIGHT.rest
}

export function resolveNodeMotion({ activeTransition, hovered, hoveredId = null, index, kind, policy, progress, revealed = true, selected, selectedId }) {
  const isChild = kind === "child"

  // Layer 5: a child node is collapsed into its parent until that parent (or the
  // child itself) is selected. Child motion is independent of the Layer 3 radial
  // contraction, so core/radial output below is unchanged.
  if (isChild && !revealed) {
    return Object.freeze({ brightness: 1, emissive: 0.15, opacity: 0, radialScale: 1, scale: 0.0001 })
  }

  const baseScale = kind === "core" ? 1 : isChild ? 0.52 : 0.58
  const muted = Boolean(selectedId && !selected && kind !== "core" && !isChild)
  const entry = resolveEntryProgress({ activeTransition, index, policy, progress })
  const radialTarget = resolveRadialTarget(null, selectedId)
  const emphasis = selected ? 1 + 0.38 * policy.scaleTravel : hovered ? 1 + 0.1 * policy.scaleTravel : 1
  const contextualScale = kind === "core" && selectedId ? 1 - 0.28 * policy.scaleTravel : 1
  const entryScale = isChild ? 1 : 0.72 + entry * 0.28
  const radialScale = isChild ? 1 : activeTransition?.name === TRANSITIONS.entry ? 0.72 + entry * 0.28 : radialTarget.radiusScale
  const tier = spotlightTier({ hovered, hoveredId, kind, selected, selectedId })
  // A hovered node that selection had muted is lifted so the active object stays legible.
  const restingOpacity = muted ? (hovered ? 0.75 : 0.3) : kind === "core" && selectedId ? 0.72 : 1
  return Object.freeze({ brightness: tier.brightness, emissive: tier.emissive, opacity: isChild ? tier.opacity : entry * Math.min(restingOpacity, tier.opacity), radialScale, scale: baseScale * emphasis * contextualScale * entryScale })
}
