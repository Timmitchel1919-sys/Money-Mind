import { calculateCameraState } from "../../spatial/runtime/camera/cameraUtils.js"

export function resolveCameraMotion({ mobile, policy, selectedPosition }) {
  const overview = calculateCameraState({ mobile })
  if (!selectedPosition) return overview
  const focused = calculateCameraState({ mobile, selectedPosition })
  return Object.freeze({ position: Object.freeze(overview.position.map((value, index) => value + (focused.position[index] - value) * policy.travel)), target: Object.freeze(focused.target.map((value) => value * policy.travel)) })
}
