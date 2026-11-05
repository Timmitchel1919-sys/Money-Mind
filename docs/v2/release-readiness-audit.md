# Money Mind V2 release-readiness audit

Audit of branch `codex/ux-remediation-2026-11-05` at source commit `ca2c58d`.
This is an evidence snapshot, not production acceptance.

## Repository and deployment boundary

- Existing unrelated tracked media deletions and untracked reference files
  were present before the audit. They were not staged or changed. A build
  from the dirty checkout would omit the locally deleted tracked media.
- `.firebaserc` selects `money-mind-90176`; `firebase.json` configures Hosting
  site `money-mind-90176` and serves `dist/`. Production deployment requires
  explicit user approval and is not authorized by this audit.
- Tracked `.env.production` sets the V2 master, spatial UI and app shell to
  true and Firebase emulator mode to false. It does not set `VITE_V2_SPLINE`;
  the centralized flag resolver therefore leaves Spline off.
- No `.github` workflow directory was present in the audited checkout; this
  does not establish that no external CI or Hosting automation exists.

## Validation snapshot

- V2 application: 303 assertions; spatial universe: 238 assertions; Spline
  resolver and framing tests: pass. Graph contract, engine, transform, spatial
  adapter and builder: 676 assertions combined, pass.
- Financial domain, projection, projection parity, authority and hook tests:
  pass. The parity test reported no regressions in its covered cases. These
  tests do not validate all live data or prove mixed-currency correctness.
- Lint exits successfully with 13 existing warnings. No typecheck script is
  defined in `package.json`.
- `git archive` of `ca2c58d` was built in an isolated directory using a
  junction to the existing `node_modules`: Vite build and PWA artifact test
  passed; the archive included eight tracked video files. This is not a fresh
  dependency installation or a reproducibility proof. No `.map` files were
  found in that output. Large JavaScript chunk warnings remain.
- The PWA artifact test passes. Earlier local Chrome evidence showed worker
  registration, offline shell navigation, and no installability errors in a
  normal temporary profile. Actual installation and update lifecycle are not
  verified; neither is safe offline financial behavior.

## Firebase and security

- Global Firebase CLI package reports version `13.35.1` from its package
  metadata; bundled Node is `v24.22.1` and npm is `12.0.2`. A bounded CLI
  `--version` attempt produced no output even with `CI=true`, update checks
  disabled and an isolated XDG configuration. The root cause is unknown.
- An earlier demo-project Auth/Firestore emulator attempt did not start within
  its bounded wait. No current authenticated, cross-user or rule-denial tests
  were completed. The emulator configuration refuses production project IDs.
- The existing Firestore rule gates recursive `users/{uid}` paths on matching
  authenticated UID, but does not constrain document field types, values or
  application-level sizes. Do not strengthen or deploy rules until existing
  collection schemas, legacy records and emulator regression tests are ready.
- **Major static finding:** the same owner-writable recursive rule includes
  `users/{uid}/moneyAIUsage/{functionName}`. Cloud Functions use those documents
  for `agentQuery` and voice rate limiting, so a client appears able to modify
  or delete its own counters and bypass that per-user control. This finding is
  inferred from repository rules and server source; deployed production rules
  and Functions were not independently inspected, and it has not been exercised
  against an emulator or production. If deployed, remediation requires excluding the path from all
  overlapping client allow rules, or moving it to a server-only path, then
  testing compatibility and authorization before any separately approved
  rules or Functions deployment.
- Initial write-path inventory: shared helpers write `budgets`, `transactions`,
  `assets`, `liabilities`, `goals`, `debts`, `bills`, `investments`,
  `savingsPlans` and Money AI history under the user path. The server also uses
  `settings/preferences` and `moneyAIUsage`. This is not a complete legacy
  schema inventory. KPI targets and profiles are stored in browser localStorage;
  no full browser-storage privacy audit has been completed.
- An `npm audit --omit=dev` attempt produced no output within the bounded wait;
  dependency vulnerability status is unknown. No claim of a secrets-free
  bundle or complete dependency audit is made.

## Financial-intelligence finding

`useFinancialCoach` returns an `askQuestion` function whose debt, investment
and cash-flow responses contain literal `SRD`. The current `AIFinancialCoach`
page consumes only the hook's action list, not that function. Its KPI input
does not carry a currency context, so a safe mixed-currency fix requires tracing
source data and the existing conversion policy before labeling totals. This
path was not modified or declared currency-safe.

## Release blockers

An undeployed rules WIP excludes the server-owned rate-limit counter path from
the owner grant, but emulator authorization, legitimate client workflows and
concurrency are not validated. See `security-remediation-report.md`.
Native Spline events and labels remain unverified; authenticated workspace and
cross-user isolation tests did not run; actual PWA installation, update and
financial offline behavior are unverified; dependency advisory and full secret
reviews are incomplete. Preserve unrelated local changes and obtain explicit
approval before any production deployment.
