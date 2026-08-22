import { SCENE_STATES, TRANSITIONS } from "../core/motionState.js"

export function resolveSelectionSequence({ currentSelectedId, nodeId, policy }) {
  if (currentSelectedId === nodeId) return Object.freeze({ name: TRANSITIONS.reset, phase: SCENE_STATES.resetting, settled: SCENE_STATES.overview, selectedId: null, duration: policy.durations.reset })
  const switching = Boolean(currentSelectedId)
  return Object.freeze({ name: switching ? TRANSITIONS.switch : TRANSITIONS.select, phase: switching ? SCENE_STATES.switching : SCENE_STATES.selecting, settled: SCENE_STATES.focused, selectedId: nodeId, duration: switching ? policy.durations.switch : policy.durations.select })
}

export function resolveResetSequence(policy) {
  return Object.freeze({ name: TRANSITIONS.reset, phase: SCENE_STATES.resetting, settled: SCENE_STATES.overview, selectedId: null, duration: policy.durations.reset })
}
