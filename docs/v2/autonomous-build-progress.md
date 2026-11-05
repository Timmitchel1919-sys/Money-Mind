# Money Mind V2 autonomous build progress

## Current state

- Branch: `codex/ux-remediation-2026-11-05`; prior Spline WIP checkpoint `4b5a417` was pushed.
- Spline remains disabled by default and requires the V2 master flag. The
  existing R3F spatial renderer and Classic view remain the fallback paths.
- Unrelated deleted media and untracked reference files were present at the
  start of the program and must not be included in commits or deployment.

## Dependency-aware execution plan

1. Harden the existing selection adapter and renderer failure states.
2. Validate responsive accessible controls and framing; defer native scene events.
3. Audit registry routes and authenticated workspace navigation.
4. Run existing financial domain, projection, graph and simulation tests before
   proposing changes to calculations or data contracts.
5. Audit intelligence, Firestore rules and PWA behavior independently.
6. Complete release checks only after the preceding gaps are resolved.

## Phase status and evidence

| Phase | Status | Evidence / remaining work |
| --- | --- | --- |
| 0 — audit | In progress | Reviewed registry, router, motion, Spline adapter, Firestore rules, Firebase and PWA configuration. Baseline checkpoint already exists. |
| 1 — interaction | In progress | Commit `22440f5` pushed: reject unavailable modules, show loading/fallback feedback, and surface missing native events in development. Browser harness at 320 and 1440 px selected Money Movement and returned to Core; native click, listener lifecycle and real authenticated routing remain unverified. |
| 2 — responsive UX | In progress | Existing WIP includes responsive framing and registry controls. Full mobile/landscape, touch, fallback and accessibility validation remains. |
| 3 — workspaces | Not complete | Route and authenticated-session audit required. |
| 4 — financial data | Not complete | Baseline domain, projection, parity, authority, hook and graph-builder tests passed; no financial calculation changes made. |
| 5 — intelligence | Not started | Inspect existing functionality before changes. |
| 6 — security | Not complete | Rules read; emulator authorization tests not run. |
| 7 — PWA | In progress | Added the missing manifest and Apple PNG icons and restored production service-worker registration. Artifact checks passed; local Chrome registered a worker and returned HTTP 200 for offline shell navigation. Installation UI, update lifecycle and financial-data offline behavior remain unverified. |
| 8 — release | Blocked | Native Spline interaction, authenticated flows, PWA and security release checks remain open. |

Baseline checks: selection and framing tests passed; V2 app 226 assertions,
spatial universe 238 assertions, graph builder 129 assertions, financial domain,
projection, projection parity, authority and hook integration tests passed.
Interaction hardening checks: selection and framing tests passed, V2 app 226
assertions and spatial universe 238 assertions passed, lint completed with
existing warnings, and the production build completed with service-worker
generation. The browser harness used isolated test props, not an authenticated
financial session. Production deployment has not been performed or approved.

## Spline editor actions

Configure native Mouse Down events on the five registered `MM_MAIN_*` objects,
repair the blank native text without changing IDs, export for both WebGPU and
WebGL 2, then test real object clicks, touch, camera focus and event cleanup.
Do not mistake the registry-driven HTML controls for native 3D selection.

## Release checklist

- [ ] Complete authenticated route and per-user isolation checks.
- [ ] Validate financial and security changes with suitable isolated fixtures.
- [ ] Verify PWA icons, installation, offline shell and update behavior.
- [ ] Test responsive, reduced-motion and WebGL-fallback behavior.
- [ ] Keep the incomplete Spline flag off by default.
- [ ] Review unrelated local changes and use a clean release artifact.
- [ ] Obtain production approval and verify the Hosting target before deployment.

Next executable task: validate installation and updates in supported browsers,
then audit authenticated routes and security rules in isolated environments.
