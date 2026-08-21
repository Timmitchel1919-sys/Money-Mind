const FLAG_DEFINITIONS = Object.freeze({
  v2Enabled: "VITE_V2_ENABLED",
  v2SpatialUI: "VITE_V2_SPATIAL_UI",
  v2GraphEngine: "VITE_V2_GRAPH_ENGINE",
  v2MotionEngine: "VITE_V2_MOTION_ENGINE",
  v2Simulation: "VITE_V2_SIMULATION",
  v2AI: "VITE_V2_AI",
})

function readBoolean(value) {
  return typeof value === "string" && value.trim().toLowerCase() === "true"
}

/**
 * Central, immutable V2 feature state. All V2 flags intentionally default off.
 * Child capabilities also require the V2 master switch.
 */
export function resolveFeatureFlags(environment = import.meta.env) {
  const v2Enabled = readBoolean(environment[FLAG_DEFINITIONS.v2Enabled])

  return Object.freeze({
    v2Enabled,
    v2SpatialUI: v2Enabled && readBoolean(environment[FLAG_DEFINITIONS.v2SpatialUI]),
    v2GraphEngine: v2Enabled && readBoolean(environment[FLAG_DEFINITIONS.v2GraphEngine]),
    v2MotionEngine: v2Enabled && readBoolean(environment[FLAG_DEFINITIONS.v2MotionEngine]),
    v2Simulation: v2Enabled && readBoolean(environment[FLAG_DEFINITIONS.v2Simulation]),
    v2AI: v2Enabled && readBoolean(environment[FLAG_DEFINITIONS.v2AI]),
  })
}

export const featureFlags = resolveFeatureFlags()
export { FLAG_DEFINITIONS }
