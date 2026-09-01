# CLAUDE.md — Money Mind

Shared project context for Claude Code and other Claude surfaces. Read this at
the start of every session before working in this repo.

## What this is
Money Mind is a personal-finance web app: React + Vite frontend, Firebase
backend (Hosting, Authentication, per-user Firestore, Cloud Functions), PWA.
- Repo: github.com/Timmitchel1919-sys/Money-Mind
- Firebase project: money-mind-90176 (default in .firebaserc); Hosting serves dist/
- Live URL: https://money-mind-90176.web.app

## V2 upgrade (current focus)
V2 is an evolutionary upgrade on top of a working V1, gated behind centralized
feature flags. V1 stays the functional baseline; V2 is OFF by default
(VITE_V2_ENABLED unset/false; child flags require it true). Work proceeds in
numbered "layers"; each layer records validation evidence in docs/v2/validation/
before it is accepted. Traceability lives in docs/v2/chapter-registry.yaml.

Status (2026-08-31):
- Layer 1 foundation (feature flags, contracts, tokens, ADRs) — done
- Layer 2 + 2C spatial/visual runtime (R3F/Three, placeholder proof-nodes) — accepted
- Layer 3 motion & interaction engine — ACCEPTED (commit cb98f8b)
- Layer 4 real financial data in the spatial nodes — ACCEPTED (2026-08-31,
  docs/v2/validation/layer-4-financial-data.md). Pure adapter
  src/visualization/adapters/financialSpatialAdapter.js turns useFinancialKPIs totals
  into the scene; per-domain node size = share of the largest domain (floor 0.35),
  applied renderer-side in SpatialNode so the Layer 3 motion policy is untouched.
- Layer 5 graph drill-down (v2GraphEngine flag) — ACCEPTED (2026-08-31, branch
  claude/v2-layer-5-graph-drilldown; docs/v2/validation/layer-5-graph-drilldown.md).
  Selecting a domain fans it out into one level of 3D child nodes (new
  src/hooks/useFinancialBreakdown.js selector → adapter `children` → kind:"child" nodes
  on a ring), collapsing on Overview; child click focuses the line item. Only the child
  branch of resolveNodeMotion is new; Layer 3 motion matrix re-verified in all modes.
  Fixed en route: signed-in `#spatial` route guard (App.jsx used PROTECTED_PAGES, not
  APP_PAGES) and an R3F `raycast`-toggle pitfall that made child nodes unclickable.
- Layer 6 simulation (v2Simulation flag) — ACCEPTED (2026-08-31, branch
  claude/v2-layer-6-simulation; docs/v2/validation/layer-6-simulation.md). A
  "Simulate" toolbar toggle opens a lever panel (months forward, extra debt/saving,
  investment return, one-off); the scene re-scales to projected figures with an amber
  "Projection · +N mo" badge. New pure src/financial/projection/projectFinancials.js
  (first occupant of src/financial/) — separate from V1 math; actual path unchanged.
  Flag off = Layer 5 exactly.
- Layers 4 + 5 + 6 are now merged into develop/v2 (2026-09-01, merges e7b71a6/ce00988/
  271bdaf). All V2 spatial layers 1–6 are integrated and V2 remains OFF by default on
  the live site.
- NEXT: v2AI (Money AI in the scene) or productionize the spatial view (real nav entry,
  chapter-registry).

## Architecture boundaries (src/)
- app/            composition & configuration
- core/           cross-cutting infra (feature flags, auth, data, security)
- financial/      financial domain models/services (introduced incrementally)
- visualization/  renderer-neutral adapters & visualization models
- spatial/        spatial contracts + rendering runtime
- motion/         motion policy, tokens, orchestration
- ai/             V2 intelligence boundary (existing Money AI unchanged)
- shared/, styles/  reusable code, V2 design tokens

Foundation rules:
1. Financial calculations do not live in rendering components.
2. Renderers consume normalized models via adapters; never query Firestore directly.
3. Critical financial info always has a non-spatial (V1) path.
4. V2 flags default off; child flags require VITE_V2_ENABLED=true.
5. Add a new dependency only in the layer that immediately uses it.
6. Never change Firebase schemas or financial calculations as a side effect of visual work.

## Conventions
- Line endings: LF everywhere, enforced by .gitattributes (* text=auto eol=lf). Do not reintroduce CRLF.
- Commits: Conventional Commits (feat/fix/chore/docs + scope), e.g. `feat(v2): ...`.
- Keep V2 work behind flags; never enable V2 on the live site as a side effect.

## Build / deploy
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build` (outputs dist/)
- Deploy hosting only: `firebase deploy --only hosting`
  (firebase.json also defines Firestore + Functions; scope to hosting to avoid touching them.)

## Notes for cloud / remote sessions
- Firebase/Google endpoints are blocked from the Anthropic cloud sandbox, so `firebase deploy` must run on a local machine.
- node_modules holds host-OS native binaries; a Linux sandbox cannot reuse a Windows install for native deps (e.g. rolldown). Build on the host, or reinstall in the sandbox.

## Codebase map
Entry: src/main.jsx -> src/App.jsx. App.jsx (~930 lines) owns hash-based routing
(#route), top-level orchestration and some calculations — a known refactor target
(decompose incrementally once regression coverage exists; see docs/v2/migration/v1-to-v2.md).

- src/pages/ — ~27 route screens: Dashboard, Budget, Bills, Transactions, Goals,
  DebtManager, EmergencyFund, SavingsPlanner, NetWorth, RetirementPlanner,
  InvestmentTracker, PortfolioDashboard, DividendDashboard/Tracker, CashFlowForecast,
  KPIDashboard, FinancialHealth, FinancialCalendar, Reports, Charts, ExportCenter,
  Currencycenter, InflationCalculator, LoanPayoffCalculator, AIFinancialCoach, Settings.
- src/hooks/ — per-domain data hooks, each Firestore-backed and per-user
  (useAssets, useBudget, useBills, useDebt, useGoals, useInvestments, useSavings,
  useEmergencyFund, useRetirement, useTransactions, useMoneyMindData, ...), plus
  Money AI (useMoneyAI, useMoneyAIContext, useFinancialCoach), voice
  (useSpeechRecognition/Synthesis, useVoiceConversation), and app lock (useAppLock).
- src/services/ — aiService.js (Money AI client), firestoreService.js (Firestore
  access), currencyService.js, openaiVoiceService.js, biometricAuth.js.
- src/firebase.js — Firebase app/auth/Firestore initialization.
- src/core/feature-flags/ — centralized V2 feature flags (the on/off switch for all V2).
- src/spatial/ — V2 spatial view: SpatialExperience.jsx, contracts.js, runtime/, performance/.
- src/motion/, src/visualization/ — V2 motion policy/tokens and renderer-neutral adapters.
- src/components/, src/layouts/, src/constants/, src/styles/ — shared UI, layout, config, tokens.

Backend: functions/ (Cloud Functions), firestore.rules (per-user isolation), firebase.json.
Data model: per-user Firestore collections; do not change schemas as a side effect of visual work.
