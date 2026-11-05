# Phase 1H — Spatial Navigation and Existing Workspace Integration

**Status: Implemented and emulator-accepted. Production opts into the V2 spatial app shell through `.env.production`; V2 remains off by default in development and optional child capabilities remain disabled.**

## Scope

The V2 registry is the navigation source for five primary modules and their
existing destinations. It contains 25 existing V1 workspaces and one action:

- Dashboard: Financial overview.
- Money Movement: Monthly Budget, Transactions, Bills, Cash Flow Forecast,
  Financial Calendar.
- Wealth Building: Net Worth, Financial Goals, Savings Planner, Emergency Fund,
  Debt Manager, Investment Tracker, Portfolio Dashboard, Dividend Tracker,
  Dividend Dashboard, Retirement Planner, Inflation Calculator, Loan Payoff.
- Intelligence: Money AI action, Financial Health, Financial KPIs, Reports,
  Charts, Export Center.
- Settings: Settings and Currency Center.

Currency Center remains the same V1 route and screen; its V2 grouping under
Settings is an intentional navigation classification only. Existing local or
session-calculated planner state remains local. This work does not change
financial calculations, Firestore schemas, authentication behavior, or
`firestore.rules`.

Each registry entry declares its ID, parent, label, availability, destination,
navigation order/restore behavior, and optional icon. Canonical locations are
`#v2`, `#v2/{moduleId}/{submoduleId}` and
`#workspace/{route}/{moduleId}/{submoduleId}`. Money AI uses
`#workspace/action/{moduleId}/{submoduleId}`. Invalid/unavailable entries fall
back to the spatial core. Legacy `#route` workspace URLs remain resolvable.

The E2E runner covers actual login through the app, User A/User B Firestore
Rules probes, unauthenticated denial, every registry destination, Money AI,
deep links, browser Back/Forward, refresh, sign-out, keyboard/touch input,
reduced motion, WebGL fallback, spatial target overlap, and the requested five
viewport sizes. It uses only the `demo-money-mind-e2e` project, runs Vite on
127.0.0.1, blocks non-loopback HTTP(S) and WebSocket traffic, and removes
synthetic Auth users, Firestore evidence, child processes, and unique temp data.

## Validation performed

On 2026-11-04, the checkout was `claude/v2-layers-8-12-app-shell` at
`82a52cc0c7ba560a952f4232df67f40ea2eb238b`, with origin pointing to the same
branch head. The supplied expected HEAD `14d4186` is an ancestor, not the
current head; this work does not reset or rewrite the branch.

- `npm run test:v2-app`: passed, 218 assertions.
- 11 additional graph, spatial-universe, financial-domain, and projection
  regression scripts: passed (12 scripts total with `test:v2-app`).
- `npm run lint`: exit 0; existing warnings remain in unrelated files.
- Production Vite build to a unique temporary output directory: passed (2,551
  modules). Vite reports the existing large-chunk advisory; temporary output
  was removed.
- Node syntax checks, PowerShell parse checks, and `git diff --check`: passed.
- Firestore Rules are unchanged.

## Host-run blocker and evidence boundary

The full command `npm run test:e2e:phase1h` was attempted with the Windows host
runner, Node v24.22.1, the checkout's resolved Playwright package, and Chrome
156.0.8078.80. It stopped before making test accounts or starting Vite because
Auth at `127.0.0.1:9099` returned `ECONNREFUSED`. A separate loopback check found
no listener on either 9099 or 8080.

After the PowerShell runner was updated to discover nvm-installed Node versions,
it resolved Node v22.23.3 plus the same Playwright, Vite, and Chrome installs.
The suite again stopped before account creation because this execution context
returned `EACCES` for Auth loopback access. The runner now reports this as a
sandbox loopback restriction and directs the operator to ordinary Windows
PowerShell.

Later Windows-host attempts used the running demo emulators. The first reached
the login navigation but exceeded Playwright's `domcontentloaded` timeout while
Vite optimized dependencies. The runner was changed to wait for the local HTML
commit and then explicitly wait for the login form. A subsequent host run
successfully passed emulator preflight, created the synthetic users, exercised
the authentication and Rules assertions, and entered the registered workspace
flow. It stopped at Cash Flow Forecast because both an `h1` and `h2` matched the
same strict heading query. The next run progressed farther through the registry
and stopped at Financial KPIs because its title includes a nested PageInfo
button in the accessible heading name. The check now waits for the exact
rendered title text instead of assuming a heading level or accessible name. A
further run passed the workspace-title checks and exposed a motion-state timer
race: selecting a module updated the URL, and cleanup of the entry animation
could cancel the module-selection settlement timer. The scene then remained in
`selecting`, failing the reduced-motion acceptance check. `MotionProvider` now
tracks and cleans up only its own entry timer. Earlier cleanup paths completed
without reporting failures. The next host run passed that settlement check and
then timed out clicking a spatial node while the Core entry animation was
still running. The runner now waits for the spatial stage to settle to its
overview state before the first module click and before reduced-motion and
keyboard interaction. A subsequent run progressed through the reduced-motion
checks and responsive navigation, where the informational Core panel intercepted
pointer input intended for the Wealth Building node. Core-level context now
passes pointer input through to spatial labels; module-level navigation panels
remain interactive.
A retry between host runs stopped at emulator preflight because Auth was not
listening on port 9099; it did not create users or launch a browser. These
earlier attempts did not constitute full acceptance. On 2026-11-04, the
Windows-host runner completed with `result: PASS` against
`demo-money-mind-e2e`, using Node v22.23.3, Playwright resolved from this
checkout, and Chrome 156.0.8078.80. The final JSON reported actual login and
sign-out, User A owner read/write, User A cross-user read/write denied, and
unauthenticated read/write denied. It also reported all registered workspaces,
Money AI, Transactions handoff, Back/Forward, deep links, refresh, keyboard,
touch, reduced motion, WebGL fallback, no overlapping submodule targets, and
all five viewport sizes passed. Synthetic Firestore documents and Auth users
were deleted. Zero browser requests completed to non-loopback hosts; Google
Fonts and exchange-rate requests were blocked, no WebSockets were attempted,
and no production Firebase endpoint was attempted. The Functions probe was
confined to the local emulator address and failed locally as expected.

After the host acceptance passed, all 12 registered regression scripts passed,
including 218 V2 app assertions. `npm run lint` exited successfully with 13
existing warnings. An isolated production build transformed 2,551 modules and
completed successfully; it emitted the existing large-chunk advisory. Node
syntax, PowerShell parse, and `git diff --check` also passed. The isolated build
output was removed. Phase 1H acceptance evidence is complete; unrelated dirty
and untracked workspace files remain untouched.

## Production Hosting release

Commit `ab7c06a58a1c7323c915d45455be3fc5e7215528` was deployed with
`firebase deploy --only hosting --project money-mind-90176`. The release was
built from that clean pushed commit in an isolated worktree, with emulator mode
false and all V2 feature flags explicitly false. Firestore Rules and Cloud
Functions were not deployed. Firebase reported `Deploy complete!`; the live
site `https://money-mind-90176.web.app` returned HTTP 200 and contained the
Money Mind page title. The default Theme 4 and dark-mode Theme 13 video URLs
also returned HTTP 200. The isolated release worktree was removed. Pending
local media deletions and untracked design/tooling files were excluded from the
production artifact.

The first isolated startup attempt used a malformed absolute Rules path. Firebase
CLI resolved it below the temporary directory, warned that it would otherwise
default to allowing reads and writes, and then exited with a fatal error. No
browser or E2E runner was started and no test users or documents were created.
That temporary directory was removed. A second attempt used project ID
`demo-money-mind-e2e`, explicit `127.0.0.1` bindings, and a temporary copy of
`firestore.rules` whose SHA-256 matched the repository file. Firestore then
failed with Java `Unable to establish loopback connection`; the emulator
process shut down. No Rules file was changed or used for test traffic, and no
production Firebase data was accessed. The temporary files from the second
attempt were removed. These sandbox startup failures occurred before the
Windows-host emulators were started; the successful host run documented above
supersedes that earlier evidence boundary.

The pre-existing Layer 3 browser harness was not run: it writes to fixed report
and screenshot paths that already contain validation evidence. No typecheck
script is defined in `package.json`. This Phase 1H acceptance does not claim
acceptance of that separate Layer 3 harness.

## Safe Windows PowerShell run

Run this in an ordinary Windows PowerShell session where the Firebase Auth and
Firestore emulators are already listening on loopback. The test runner itself
probes runnable Node executables on `PATH`, then checks nvm installation roots
for an executable version without changing the active nvm selection. It also
verifies Playwright, Vite, and Chrome or Edge; it does not assume a fixed Node
installation path.

```powershell
$ErrorActionPreference = 'Stop'
$repoRoot = 'C:\Users\Administrator\Downloads\AI Webapp Projects\Money-Mind'
Set-Location -LiteralPath $repoRoot

$expectedBranch = 'claude/v2-layers-8-12-app-shell'
$actualBranch = (git branch --show-current).Trim()
if ($actualBranch -ne $expectedBranch) { throw "Wrong branch: $actualBranch" }
$actualRoot = (git rev-parse --show-toplevel).Trim()
if ($actualRoot -ne (Resolve-Path -LiteralPath $repoRoot).Path) { throw "Wrong repository: $actualRoot" }

foreach ($port in @(9099, 8080)) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $connect = $client.ConnectAsync('127.0.0.1', $port)
    if (-not $connect.Wait(2000) -or -not $client.Connected) {
      throw "Firebase emulator is not reachable at 127.0.0.1:$port"
    }
  }
  finally { $client.Dispose() }
}

& .\scripts\e2e\run-phase1h.ps1
```

The runner binds Vite to `127.0.0.1` and configures the app with
`VITE_FIREBASE_EMULATORS=true` and
`VITE_FIREBASE_PROJECT_ID=demo-money-mind-e2e`. It refuses invalid project IDs,
asserts browser requests use Auth `127.0.0.1:9099`, Firestore
`127.0.0.1:8080`, and Functions `127.0.0.1:5001`, and blocks other browser
network destinations. Do not substitute production credentials or a production
project ID.
