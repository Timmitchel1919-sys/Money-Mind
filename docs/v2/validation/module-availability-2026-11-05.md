# V2 module availability — 2026-11-05

The registry now accepts an optional `availability` value on a main module and
rejects unknown values. An unavailable main module is removed from the visible
registry and rejected by available-only submodule lookup, spatial deep links,
workspace deep links and action fallback lookup. Existing modules omit the
field and retain their previous behavior. This is navigation behavior, not an
authorization boundary; Firebase authentication and Firestore rules remain
responsible for access control.

Validation: `node scripts/v2/validate-v2-app.mjs` passed 311 assertions;
`node scripts/v2/validate-spatial-universe.mjs` passed 238 assertions;
`node tests/financial/splineSelectionAdapter.test.mjs` passed; Oxlint exited 0
with existing warnings. Browser tests with an authenticated user and emulator
authorization tests were not run. Native Spline interactions and labels remain
deferred. The existing uncommitted package and security work was not included.
