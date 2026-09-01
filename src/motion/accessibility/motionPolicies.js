import { MOTION_PREFERENCES } from "../../spatial/contracts.js"
import { motionDurations, motionStaggers } from "../transitions/motionTokens.js"

const POLICIES = Object.freeze({
  full: Object.freeze({ id: "full", cameraDamping: 4.4, nodeDamping: 8, edgeDamping: 7, radialDamping: 6, travel: 0.68, scaleTravel: 1, stagger: motionStaggers.medium, durations: Object.freeze({ entry: motionDurations.cinematic, select: 560, switch: 480, reset: 600 }) }),
  reduced: Object.freeze({ id: "reduced", cameraDamping: 11, nodeDamping: 16, edgeDamping: 15, radialDamping: 13, travel: 0.44, scaleTravel: 0.55, stagger: motionStaggers.small, durations: Object.freeze({ entry: 260, select: 260, switch: 220, reset: 260 }) }),
  minimal: Object.freeze({ id: "minimal", cameraDamping: 30, nodeDamping: 32, edgeDamping: 32, radialDamping: 30, travel: 0.18, scaleTravel: 0.25, stagger: 0, durations: Object.freeze({ entry: 80, select: 80, switch: 80, reset: 80 }) }),
  off: Object.freeze({ id: "off", cameraDamping: Infinity, nodeDamping: Infinity, edgeDamping: Infinity, radialDamping: Infinity, travel: 0, scaleTravel: 0, stagger: 0, durations: Object.freeze({ entry: 0, select: 0, switch: 0, reset: 0 }) }),
})

export function systemMotionPreference(matchMedia = globalThis.matchMedia?.bind(globalThis)) {
  return matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full"
}

export function normalizeMotionPreference(value) {
  return MOTION_PREFERENCES.includes(value) ? value : systemMotionPreference()
}

export function resolveMotionPolicy(value) {
  return POLICIES[normalizeMotionPreference(value)]
}
