import { openModuleIntent, returnToCoreIntent } from "../../app/v2/navigation/spatialNavigation.js"

// Object IDs refer to the current editable scene, not a published export.
// Revalidate them against the actual runtime asset before enabling an adapter.
export const SPLINE_CORE_OBJECT_ID = "6ebd998f-74fe-42a9-8e7b-f6e19cae3206"
/** Resolve a Spline object ID to an existing motion intent, or fail closed. */
export function resolveSplineSelection(objectId, visibleModules = []) {
  if (objectId === SPLINE_CORE_OBJECT_ID) return returnToCoreIntent()
  if (typeof objectId !== "string" || !objectId) return null
  const module = visibleModules.find((candidate) => candidate.spatial?.splineObjectId === objectId)
  return module ? openModuleIntent(module.id) : null
}
