import assert from "node:assert/strict"
import { MODULE_REGISTRY } from "../../src/app/v2/modules/moduleRegistry.js"
import { openModuleIntent, returnToCoreIntent } from "../../src/app/v2/navigation/spatialNavigation.js"
import { resolveSplineSelection, SPLINE_CORE_OBJECT_ID } from "../../src/spatial/spline/splineSelectionAdapter.js"

assert.deepEqual(resolveSplineSelection(SPLINE_CORE_OBJECT_ID, MODULE_REGISTRY), returnToCoreIntent())
assert.equal(new Set(MODULE_REGISTRY.map((module) => module.spatial.splineObjectId)).size, MODULE_REGISTRY.length)
for (const module of MODULE_REGISTRY) {
  assert.ok(module.spatial.splineObjectId)
  assert.deepEqual(resolveSplineSelection(module.spatial.splineObjectId, MODULE_REGISTRY), openModuleIntent(module.id))
  assert.equal(resolveSplineSelection(module.spatial.splineObjectId, []), null)
}
assert.equal(resolveSplineSelection("unknown", MODULE_REGISTRY), null)
assert.equal(resolveSplineSelection("toString", MODULE_REGISTRY), null)
assert.equal(resolveSplineSelection(null, MODULE_REGISTRY), null)
console.log("Spline selection contract: passed")
