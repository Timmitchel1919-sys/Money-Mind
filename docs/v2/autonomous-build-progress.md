# Money Mind V2 autonomous build progress

## Current state

- Branch: `codex/ux-remediation-2026-11-05`; prior Spline WIP checkpoint `4b5a417` was pushed.
- Spline remains disabled by default and requires the V2 master flag. The
  existing R3F spatial renderer and Classic view remain the fallback paths.
- The tracked `.env.production` enables the V2 master, spatial UI and app
  shell. This is newer than the default-off V2 status in `AGENTS.md`; do not
  assume production builds are V1-only. `VITE_V2_SPLINE` is not set there.
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
| 3 — workspaces | In progress | Commit `78706c5` pushed: registry-wide route round-trip and matching `App.jsx` workspace render-branch checks pass (303 V2 assertions total). This is static validation; authenticated sessions, permissions and real workspace operations remain unverified. |
| 4 — financial data | Not complete | Domain, projection, parity, authority, hook, graph contract, engine, transform, spatial adapter and builder tests passed; no financial calculation changes made. These tests do not establish correctness for all live records. |
| 5 — intelligence | Not complete | Initial inspection found local and optional server-side providers. `useFinancialCoach` contains hardcoded SRD text in its exported `askQuestion`; its current page caller uses only `actions`. Confirm currency requirements and add coverage before changing this path. |
| 6 — security | Blocked | Rules inspected; demo-project emulator command produced no output and did not start within the bounded attempt. It was stopped; authorization and isolation are not verified. See security audit below. |
| 7 — PWA | In progress | Commit `ee296f7` pushed: added the missing manifest and Apple PNG icons and restored production service-worker registration. Artifact checks passed; local Chrome registered a worker, returned HTTP 200 for offline shell navigation, and reported no installability errors in a temporary non-incognito profile. Installation UI, update lifecycle and financial-data offline behavior remain unverified. |
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

## Release-readiness audit continuation

At `ca2c58d`, the current baseline suites passed again, including 303 V2 and
238 spatial assertions and 676 graph assertions. A clean committed-source
archive built successfully using the existing dependency installation; its
PWA artifact checks passed and eight tracked videos were present. Production
flags resolve V2 shell on and Spline unset. This is not a fresh-install build.
Firebase CLI 13.35.1 still produced no output for `--version` with isolated
configuration; npm advisory audit also timed out. Detailed evidence and the
explicit blocked release plan are in `release-readiness-audit.md` and
`release-candidate-report.md`. No production deployment is authorized.

## Firestore rules audit (static, not an emulator result)

```json
{
  "score": 2,
  "summary": "Authenticated UID ownership gates recursive user paths, but also permits clients to modify their own server-side Money AI rate-limit documents. This is a static finding; no emulator authorization result is available.",
  "findings": [
    {
      "check": "Server-controlled rate-limit authority",
      "severity": "major",
      "issue": "The repository's owner-writable recursive rule covers users/{uid}/moneyAIUsage/{functionName}, while repository Cloud Functions use that path for rate-limit counters. If deployed as written, a signed-in owner appears able to alter or delete their own counter and bypass that per-user control. Deployed configuration is unverified.",
      "recommendation": "Deny client writes to server-owned usage documents with non-overlapping rules or move the counters to a server-only path, and validate the change and compatibility in the emulator before deployment."
    },
    {
      "check": "Create and update validation",
      "severity": "minor",
      "issue": "The owner can create or update arbitrary fields and types under their own user path, including malformed financial records.",
      "recommendation": "Define and test per-collection create and update constraints against the existing schema before changing production rules."
    },
    {
      "check": "Storage abuse",
      "severity": "minor",
      "issue": "The recursive owner rule imposes no application-level string, array or field limits.",
      "recommendation": "Introduce schema-aware limits with emulator coverage and an explicit migration plan."
    }
  ]
}
```

The score reflects only the rules inspected and is not a complete application
security assessment. The emulator attempt used project `demo-money-mind-e2e`,
produced no startup output, and was stopped after a bounded wait. A separate
`firebase --version` startup check also produced no output before it was stopped;
the CLI startup issue remains unresolved. No production data or rules were changed.
