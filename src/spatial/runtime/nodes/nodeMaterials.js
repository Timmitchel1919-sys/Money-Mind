// Chapter 7 (Spatial Financial Universe): brighter, bolder domain colours on a
// dark scene. One hue family per tone, spread around the wheel so domains stay
// distinguishable; the core keeps Money Mind's violet brand identity.
// `base` is the lit surface colour, `emissive` the self-glow the motion engine
// scales (hover spotlight), `accent` is kept for label/UI tinting.
export const NODE_PALETTE = Object.freeze({
  core: Object.freeze({ base: "#6f52ff", emissive: "#5b3df5", accent: "#e4dcff" }), // violet (brand)
  positive: Object.freeze({ base: "#12c29d", emissive: "#0fa888", accent: "#c4f5e8" }), // income: teal
  growth: Object.freeze({ base: "#3f86ff", emissive: "#2f6fe6", accent: "#cfe0ff" }), // investments: blue
  stable: Object.freeze({ base: "#e6b43c", emissive: "#c9921c", accent: "#fbecc4" }), // assets: gold
  liability: Object.freeze({ base: "#ee4f86", emissive: "#d63a70", accent: "#fcd3e2" }), // debt: rose
  outflow: Object.freeze({ base: "#ff7a45", emissive: "#e45f2b", accent: "#ffdccd" }), // expenses: coral
  reserve: Object.freeze({ base: "#3ccf6e", emissive: "#27b058", accent: "#cdf4da" }), // savings: green
})

export function nodePalette(node) {
  return node.kind === "core" ? NODE_PALETTE.core : NODE_PALETTE[node.tone] || NODE_PALETTE.stable
}

// Material richness follows the quality preset's lighting mode (qualityPresets.js):
// - basic (low):        plain PBR standard material, no clearcoat — cheapest.
// - standard (medium):  physical material with a light clearcoat.
// - enhanced (high/ultra): physical material, full glossy clearcoat + specular.
// All tiers reflect the scene environment set up by SpatialLighting (when the
// lighting mode enables one), which is what makes the balls read as glossy.
export const NODE_MATERIAL_TIERS = Object.freeze({
  basic: Object.freeze({ physical: false, metalness: 0.2, roughness: 0.38 }),
  standard: Object.freeze({ physical: true, metalness: 0.18, roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.18, specularIntensity: 0.8 }),
  enhanced: Object.freeze({ physical: true, metalness: 0.16, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 1 }),
})

export function nodeMaterialTier(lightingMode) {
  return NODE_MATERIAL_TIERS[lightingMode] || NODE_MATERIAL_TIERS.standard
}
