export const SCENE_STATES = Object.freeze({ overview: "overview", hovering: "hovering", selecting: "selecting", focused: "focused", switching: "switching", resetting: "resetting" })
export const TRANSITIONS = Object.freeze({ entry: "overview-entry", select: "select-node", switch: "switch-node", reset: "reset-view" })

export function transitionProgress(transition, now = performance.now()) {
  if (!transition || transition.duration <= 0) return 1
  return Math.min(1, Math.max(0, (now - transition.startedAt) / transition.duration))
}
