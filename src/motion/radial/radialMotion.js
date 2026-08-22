export function resolveRadialTarget(sceneState, selectedId) {
  return Object.freeze({ radiusScale: selectedId ? 0.94 : 1, rotation: sceneState === "switching" ? 0.018 : 0 })
}
