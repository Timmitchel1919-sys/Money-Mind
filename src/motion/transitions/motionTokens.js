export const motionDurations = Object.freeze({ instant: 0, fast: 140, normal: 280, slow: 480, cinematic: 720 })

export const motionEasings = Object.freeze({
  standard: "cubic-bezier(0.2, 0, 0, 1)", enter: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)", focus: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  reset: "cubic-bezier(0.4, 0, 0.2, 1)",
})

export const motionStaggers = Object.freeze({ small: 36, medium: 62, large: 88 })

export function durationFor(preference, duration = motionDurations.normal) {
  if (preference === "off") return 0
  if (preference === "minimal") return Math.min(duration, 80)
  if (preference === "reduced") return Math.min(duration, motionDurations.normal)
  return duration
}
