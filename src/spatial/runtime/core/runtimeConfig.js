export const SPATIAL_RUNTIME_CONFIG = Object.freeze({
  // Chapter 7 visual-fidelity pass: a deep teal-black vignette (reference:
  // docs/v2/ux/VISUAL-REFERENCE-ANALYSIS.md) instead of flat navy — pairs with
  // the warm gold edges and teal rim light below.
  background: "#050f0f",
  camera: Object.freeze({ fov: 44, near: 0.1, far: 80, overview: Object.freeze([0, 0, 7.4]) }),
  world: Object.freeze({ origin: Object.freeze([0, 0, 0]), radialDistance: 3.15, nodeUnit: 1 }),
})
