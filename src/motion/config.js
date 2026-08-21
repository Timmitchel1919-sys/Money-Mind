import { MOTION_PREFERENCES } from "../spatial/contracts.js"

export const motionDurations = Object.freeze({ instant: 0, fast: 160, standard: 280, deliberate: 480, camera: 700 })
export const motionEasings = Object.freeze({ standard: "cubic-bezier(0.2, 0, 0, 1)", emphasized: "cubic-bezier(0.2, 0, 0, 1.2)" })

export function systemMotionPreference(matchMedia = globalThis.matchMedia?.bind(globalThis)) {
  return matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full"
}

export function normalizeMotionPreference(value) {
  return MOTION_PREFERENCES.includes(value) ? value : systemMotionPreference()
}

export function durationFor(preference, duration = motionDurations.standard) {
  if (preference === "off") return 0
  if (preference === "minimal") return Math.min(duration, motionDurations.fast)
  if (preference === "reduced") return Math.min(duration, motionDurations.standard)
  return duration
}
