export const QUALITY_PRESETS = Object.freeze({
  low: Object.freeze({ id: "low", dpr: Object.freeze([1, 1]), detail: 1, antialias: false, lighting: "basic" }),
  medium: Object.freeze({ id: "medium", dpr: Object.freeze([1, 1.25]), detail: 2, antialias: true, lighting: "standard" }),
  high: Object.freeze({ id: "high", dpr: Object.freeze([1, 1.5]), detail: 2, antialias: true, lighting: "enhanced" }),
  ultra: Object.freeze({ id: "ultra", dpr: Object.freeze([1, 2]), detail: 3, antialias: true, lighting: "enhanced" }),
})

export const QUALITY_OPTIONS = Object.freeze(["auto", "low", "medium", "high", "ultra"])

export function resolveQualityPreset(requested, capabilities = {}) {
  if (requested !== "auto" && QUALITY_PRESETS[requested]) return QUALITY_PRESETS[requested]
  if (capabilities.mobileClass || (capabilities.deviceMemoryGB && capabilities.deviceMemoryGB <= 4)) return QUALITY_PRESETS.low
  if (capabilities.deviceMemoryGB >= 8 && capabilities.logicalProcessors >= 8) return QUALITY_PRESETS.high
  return QUALITY_PRESETS.medium
}
