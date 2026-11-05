import assert from "node:assert/strict"
import { resolveSplineZoom } from "../../src/spatial/spline/splineFraming.js"

assert.equal(resolveSplineZoom(1440, 900), 1)
assert.ok(resolveSplineZoom(320, 844) < resolveSplineZoom(768, 900))
assert.equal(resolveSplineZoom(1, 1000), 0.25)
assert.equal(resolveSplineZoom(0, 844), null)
assert.equal(resolveSplineZoom(390, Infinity), null)
console.log("Spline framing contract: passed")
