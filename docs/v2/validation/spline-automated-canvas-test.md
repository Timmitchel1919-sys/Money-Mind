# Spline canvas navigation test

Run `node scripts/e2e/spline-canvas-navigation.mjs` with Auth and Firestore
emulators already running on ports 9099 and 8080 for `demo-money-mind-e2e`.
Set `SPLINE_TEST_BROWSER` if Chrome is installed elsewhere. The script starts
its own Vite server on port 4178, refuses an occupied port, enables V2 and
Spline only for that process, creates a synthetic Auth user, and deletes it
afterwards. It blocks non-loopback traffic except the existing HTTPS Spline
export; blocked production Firebase requests fail the test.

The test samples left, center, and right points on each of five modules in a
1280 × 665 desktop viewport and a 390 × 844 touch viewport. It resets to Core
between successful selections and checks each actual canvas interaction against
the existing V2 hash route. These 30 fixed points describe the currently
published scene and do not prove that every pixel of an object is clickable.
If a scene update changes its geometry or camera, review the coordinates against
rendered screenshots before adjusting them. If the scene cannot be loaded, the
test fails rather than using the accessible buttons as evidence of canvas input.

On 2026-11-07, the final run passed 10 of 30 samples: the current hosted export
selected all five modules at the right sample point on both viewports. The left
and center samples failed for all five modules. An earlier run using different
mobile coordinates missed one right-edge sample, illustrating the sensitivity
of this narrow hit region. The extra native events in the editable Spline scene have not yet been
published or validated by this test. No production deployment was made.
