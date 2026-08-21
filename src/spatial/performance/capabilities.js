export const renderingQualityOptions = Object.freeze(["auto", "low", "medium", "high", "ultra"])

function detectWebGL(documentRef) {
  if (!documentRef) return false
  try {
    const canvas = documentRef.createElement("canvas")
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    return false
  }
}

/** Capability hints only; this deliberately avoids hardware benchmarking. */
export function detectRenderingCapabilities(environment = globalThis) {
  const navigatorRef = environment.navigator
  return Object.freeze({
    webGL: detectWebGL(environment.document),
    reducedMotion: Boolean(environment.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
    mobileClass: Boolean(environment.matchMedia?.("(max-width: 767px), (pointer: coarse)").matches),
    deviceMemoryGB: typeof navigatorRef?.deviceMemory === "number" ? navigatorRef.deviceMemory : null,
    logicalProcessors: typeof navigatorRef?.hardwareConcurrency === "number" ? navigatorRef.hardwareConcurrency : null,
  })
}
