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
  for (const hitId of module.spatial.splineHitObjectIds) {
    assert.deepEqual(resolveSplineSelection(hitId, MODULE_REGISTRY), openModuleIntent(module.id))
  }
}
assert.equal(resolveSplineSelection("unknown", MODULE_REGISTRY), null)
assert.equal(resolveSplineSelection("toString", MODULE_REGISTRY), null)
assert.equal(resolveSplineSelection(null, MODULE_REGISTRY), null)
assert.equal(resolveSplineSelection(MODULE_REGISTRY[0].spatial.splineObjectId, [{ ...MODULE_REGISTRY[0], availability: "unavailable" }]), null)
assert.equal(resolveSplineSelection(MODULE_REGISTRY[0].spatial.splineObjectId, [MODULE_REGISTRY[0], { ...MODULE_REGISTRY[1], spatial: MODULE_REGISTRY[0].spatial }]), null)
assert.equal(resolveSplineSelection(MODULE_REGISTRY[0].spatial.splineObjectId, [MODULE_REGISTRY[0], { ...MODULE_REGISTRY[1], availability: "unavailable", spatial: MODULE_REGISTRY[0].spatial }]), null)
assert.equal(resolveSplineSelection(SPLINE_CORE_OBJECT_ID, [{ ...MODULE_REGISTRY[0], spatial: { ...MODULE_REGISTRY[0].spatial, splineObjectId: SPLINE_CORE_OBJECT_ID } }]), null)
assert.equal(resolveSplineSelection("unknown", null), null)
assert.equal(resolveSplineSelection("fragment", [{ ...MODULE_REGISTRY[0], spatial: { splineHitObjectIds: "prefix-fragment-suffix" } }]), null)
assert.deepEqual(resolveSplineSelection("721b6035-dcfd-4a58-8379-4b8ffd90a0a9", MODULE_REGISTRY), openModuleIntent("dashboard"))
assert.deepEqual(resolveSplineSelection("ada1073d-0b47-4753-b9c5-75b3b0b290b8", MODULE_REGISTRY), openModuleIntent("settings"))
assert.equal(resolveSplineSelection("721b6035-dcfd-4a58-8379-4b8ffd90a0a9", []), null)
assert.equal(resolveSplineSelection("721b6035-dcfd-4a58-8379-4b8ffd90a0a9", [{ ...MODULE_REGISTRY[0], availability: "unavailable" }]), null)
assert.equal(resolveSplineSelection("721b6035-dcfd-4a58-8379-4b8ffd90a0a9", [MODULE_REGISTRY[0], { ...MODULE_REGISTRY[1], spatial: { ...MODULE_REGISTRY[1].spatial, splineHitObjectIds: ["721b6035-dcfd-4a58-8379-4b8ffd90a0a9"] } }]), null)
console.log("Spline selection contract: passed")
