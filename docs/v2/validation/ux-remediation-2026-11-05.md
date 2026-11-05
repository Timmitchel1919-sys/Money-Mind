# Money Mind V1 + V2 UX remediation

**Date:** 2026-11-05
**Status:** Partial implementation; authenticated browser acceptance and full route-by-route UX verification remain incomplete.
**Branch:** `codex/ux-remediation-2026-11-05`
**Baseline HEAD:** `275746f42319bfd749d1dbed0aae7fd0106d2843`

## Summary

The supplied 728 × 446 screenshot confirmed two connected issues: the fixed
V2 return button could cover dashboard values, and a Classic workspace opened
from a V2 workspace URL without an explicit mode label. The return action now
sits in the Classic page's normal content flow before the selected workspace,
and the action names its destination. The callback preserves the route's
return hash. The spatial scene and existing V1 destinations remain in place.

No financial calculations, records, Firestore schema, authentication logic,
Firestore Security Rules, or production configuration were changed. No
production record was written. Current automated tests and the isolated build
pass; this does not count as authenticated emulator acceptance.

## UX Engine skill application

| Skill | Application in this remediation |
|---|---|
| `ux-auditor` | Recorded the supplied overlap and mode ambiguity as separate findings and added geometry regression assertions. |
| `intent-discovery` | Clarified that a workspace deep link is the Classic workspace, while the return action goes back to its preserved spatial destination. |
| `information-hierarchy` | Placed the mode label and return action before workspace content in the existing scroll flow. |
| `state-completeness` | Makes the current Classic mode visible and gives it a direct return state. |
| `form-ux` | Reviewed the shared sign-in form path as part of source discovery; this change did not modify form validation or submission. Full form-state acceptance was not rerun. |
| `feedback-affordance` | Uses a clear action label, a minimum 44 px target, and a visible keyboard focus outline. |
| `responsive` | Added E2E checks at the requested base sizes plus portrait/landscape and large desktop sizes. A CSS zoom proxy and effective viewport sizes are included; they have not run in this environment. |
| `design-system` | Uses existing surface, border, text, brand, and contrast CSS variables rather than introducing new colors. |
| `visual-character` | Keeps the spatial scene and Classic dashboard identity; the bridge is a small in-flow element using existing application styling. |

## Inventory

Source inventory found 26 V1 page components:

`AIFinancialCoach`, `Bills`, `Budget`, `CashFlowForecast`, `Charts`,
`Currencycenter`, `Dashboard`, `DebtManager`, `DividendDashboard`,
`DividendTracker`, `EmergencyFund`, `ExportCenter`, `FinancialCalendar`,
`FinancialHealth`, `Goals`, `InflationCalculator`, `InvestmentTracker`,
`KPIDashboard`, `LoanPayoffCalculator`, `NetWorth`, `PortfolioDashboard`,
`Reports`, `RetirementPlanner`, `SavingsPlanner`, `Settings`, and
`Transactions`. The shared public/auth experience and app-lock components are
additional entry/state surfaces.

The V2 registry contains five primary modules, 25 existing V1 workspace
destinations, and the Money AI action. No modules were invented. The existing
Phase 1H browser runner covers those registered destinations, history, refresh,
sign-out, reduced motion, fallback behavior, and spatial interaction. That
runner was not able to execute in this run because the host emulator could not
be reached or started from the execution boundary. Therefore the source
inventory is complete, while the requested visual and state audit of every
route is **not complete**.

## Findings and changes

### MM-UX-001 — Fixed return control obscures financial content

**Evidence:** The user-supplied 728 × 446 screenshot shows the fixed control
over the Classic dashboard. A read-only inspection of the open deployed
dashboard also showed the legacy return control.
**Change:** Removed the fixed overlay and rendered the action in the reserved
content flow above the workspace. Regression coverage checks it against the
financial summary cards and the page heading.
**Verification:** Unit/contract assertion passes. Responsive browser geometry
checks are present but **BLOCKED** pending the real emulator-backed run.

### MM-UX-002 — Classic and Spatial modes are unclear

**Change:** Added the `Classic workspace` label and a `Return to Spatial
overview` action. `src/App.jsx` supplies the existing route-aware return hash,
so the action does not force a generic dashboard reset.
**Verification:** V2 route contract assertion passes. Back/Forward and deep-link
browser behavior on this change is **NOT_RUN** because authenticated E2E could
not start.

No other issue is claimed fixed by this scoped source and inventory pass.

## Modified files

- `src/layouts/DashboardLayout.jsx` — in-flow mode bridge and accessible return action.
- `src/App.jsx` — feature flag and route-aware callback wiring.
- `src/app/v2/v2-app.css` — removed the fixed overlay styling.
- `scripts/v2/validate-v2-app.mjs` — mode, focus, target-size, and route-return assertions.
- `scripts/e2e/phase1g-emulator-acceptance.mjs` — viewport, zoom-proxy, and overlap checks.
- `docs/v2/validation/ux-remediation-2026-11-05.md` — this report.

## Validation evidence

| Check | Result | Evidence |
|---|---|---|
| V2 app contracts | **PASS** | `npm run test:v2-app` — 223 assertions. |
| Financial graph contracts/engine/transform/adapter/builder | **PASS** | 25 / 77 / 105 / 340 / 129 assertions. |
| Spatial universe | **PASS** | 238 assertions. |
| Financial domain/projection/parity/authority/hooks | **PASS** | All five scripts passed; parity and hook checks reported zero regressions. |
| Regression scripts total | **PASS** | 12 configured scripts completed successfully. |
| Lint | **PASS with warnings** | Exit 0; 13 warnings in existing unrelated files. |
| Isolated production build | **PASS** | 2,551 modules; output written to a unique temporary directory and removed. Existing large-chunk advisory remains. |
| Firebase Hosting deployment | **PASS** | User-authorized Hosting-only release to `money-mind-90176`; Firebase reported deploy complete. Build directory was unique and removed afterward. |
| Live Hosting response and bundle | **PASS** | `https://money-mind-90176.web.app/` returned HTTP 200; it served `/assets/index-BjBsCC21.js`, which contains both `Classic workspace` and `Return to Spatial overview`. This verifies publication, not a visual browser interaction. |
| E2E script syntax, PowerShell parse, `git diff --check` | **PASS** | Completed without errors. |
| Authenticated E2E against Auth/Firestore emulators | **BLOCKED** | Initial run: Auth `127.0.0.1:9099` returned `ECONNREFUSED`. Sandbox loopback probes were denied. A demo-only emulator startup then failed in Firestore Java with `Unable to establish loopback connection` while creating its selector. The browser suite did not create users, launch Vite, or produce Firestore Rules evidence. |
| Deployed spatial browser view | **BLOCKED** | A separate read-only `#v2` tab redirected to `#login`; no credentials were entered. The open user tab remained on its original Classic workspace route. |
| Requested viewport and zoom browser checks | **NOT_RUN** | Test code covers 320 × 568, 375 × 667, 728 × 446, 768 × 1024, 1024 × 768, 1440 × 900, 1920 × 1080, plus 844 × 390 and zoom proxies. No pass is claimed. |
| Screen reader, actual browser zoom, color contrast measurement | **NOT_RUN** | No fresh manual or automated accessibility report was produced. CSS zoom is only a proxy, not actual Chrome magnification. |

Historical Phase 1H acceptance documented in `phase-1h-spatial-navigation.md`
is for an earlier source state and is not evidence for this remediation branch.

## Git and release state

The focused six-file UX change excludes the checkout's unrelated tracked
deletions and untracked design assets. Those existing user files remain
unstaged and untouched. The focused commit did not include them.

Commit `096f664b3ea9002f403954a510911eef7c250b1a` was pushed to
`origin/codex/ux-remediation-2026-11-05`. Per the user's explicit release
request, Hosting was deployed to `money-mind-90176` from a fresh production
build. Firestore Rules and Cloud Functions were not deployed. Existing
unrelated deletions and untracked design assets were excluded from the commit
and build.

**Acceptance status: INCOMPLETE.** Deployment does not convert the blocked
authenticated E2E, Rules, visual-route, responsive, navigation, or accessibility
checks into passing evidence. Run the emulator-backed suite from ordinary
Windows PowerShell with Auth and Firestore bound only to loopback, then record
its actual output here.
