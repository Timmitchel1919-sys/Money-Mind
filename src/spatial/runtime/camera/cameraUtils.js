export function calculateCameraState({ selectedPosition, mobile = false }) {
  if (!selectedPosition) {
    return Object.freeze({ position: Object.freeze([0, 0, 9.4]), target: Object.freeze([0, 0, 0]) })
  }

  const [x, y, z] = selectedPosition
  return Object.freeze({
    position: Object.freeze([x * 0.34, y * 0.34, (mobile ? 6.4 : 5.2) + z]),
    target: Object.freeze([x * 0.7, y * 0.7, z]),
  })
}
