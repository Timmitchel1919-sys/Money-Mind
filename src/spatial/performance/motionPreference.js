// Shared by the financial workspace (SpatialExperience) and the V2 Spatial
// Application (Layer 9): the system reduced-motion preference, plus a
// dev-only ?spatialMotion= override used by the browser acceptance harnesses.
const MOTION_PREFERENCES = new Set(["full", "reduced", "minimal", "off"])

export function resolveMotionPreference(capabilities) {
  const detectedPreference = capabilities.reducedMotion ? "reduced" : "full"
  if (!import.meta.env.DEV) return detectedPreference

  const requestedPreference = new URLSearchParams(window.location.search).get("spatialMotion")
  return MOTION_PREFERENCES.has(requestedPreference) ? requestedPreference : detectedPreference
}
