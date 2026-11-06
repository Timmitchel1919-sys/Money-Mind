# Money Mind V2 — Migration Gap Report

**Branch geïnspecteerd:** `develop/v2` · **Repo:** github.com/Timmitchel1919-sys/Money-Mind
**Datum inspectie:** 2026-09-01 · **`main` status:** onaangeroerd (read-only geïnspecteerd)
**Doel:** Money Mind V2 bouwen bovenop V1 — deze analyse legt de huidige staat vast en levert het raamwerk voor de vergelijking met de oude standalone V2 (`Money-Mind-V2.0-3D`).

> **Status van dit rapport.** Compleet. Deel A = huidige-staat inventaris van `develop/v2`. Deel B = vergelijking met de oude V2 (`Money-Mind-V2.0-3D`, uit de aangeleverde ZIP `MoneyMindV2.03Dmain.zip`, 150 bronbestanden). Deel C = aanbevolen migratie-/oogst-volgorde.

---

## 0. Samenvatting (executive summary)

Money Mind is een werkende personal-finance web-app (React 19 + Vite, Firebase Hosting/Auth/Firestore/Cloud Functions, PWA). V2 is bewust **geen** herbouw maar een **evolutionaire uitbreiding bovenop een werkende V1**, volledig achter centrale feature flags die standaard **uit** staan. De V2-opbouw verloopt in genummerde "layers", elk met validatie-bewijs in `docs/v2/validation/` en traceerbaarheid in `docs/v2/chapter-registry.yaml`.

Op `develop/v2` zijn **layers 1 t/m 6 geïmplementeerd, gevalideerd en gemerged**:

| Layer | Onderwerp | Flag | Status |
|---|---|---|---|
| 1 | V2 Foundation (flags, contracts, tokens, ADRs) | `v2Enabled` | ✅ Geïmplementeerd + gevalideerd |
| 2 / 2C | Spatial & Visual Runtime (R3F/Three) | `v2SpatialUI` | ✅ Geaccepteerd |
| 3 | Motion & Interaction Engine | `v2MotionEngine` | ✅ Geaccepteerd (cb98f8b) |
| 4 | Echte financiële data in spatial nodes | `v2SpatialUI` | ✅ Geaccepteerd |
| 5 | Graph drill-down (line items) | `v2GraphEngine` | ✅ Geaccepteerd |
| 6 | Simulatie ("what-if") | `v2Simulation` | ✅ Geaccepteerd |
| — | Money AI in de scene | `v2AI` | ⬜ Flag bestaat, nog niet geïmplementeerd (NEXT) |

**Kernbevinding voor de migratie:** de huidige V2 is een *strak gelaagde, adapter-gedreven, flag-gated* architectuur die V1 volledig intact laat. Als de oude V2 (`Money-Mind-V2.0-3D`) een *standalone 3D-app* is, dan is de migratiestrategie niet "code overzetten" maar "**capabilities heroverwegen en her-implementeren binnen de layer-grenzen**". Concreet migratie-risico zit vooral in: (a) 3D-runtime-code die Firebase/financiële berekeningen direct aanraakt (schendt ADR-0002/0003), (b) dubbele financiële wiskunde, en (c) dependencies/assets die niet in het flag-model passen.

---

## 1. Repository- & branch-topologie

**Remotes/branches (lokaal aanwezig):**

- `main` — laatste commit `4ffa43d` ("Ignore local Claude Code / agent-skills tooling"). **Blijft onaangeroerd.**
- `develop/v2` — laatste commit `5ede6a8`, up-to-date met `origin/develop/v2`. Werkende tree schoon.
- `backup/v1-pre-v2` — veiligheidsbranch met de gevalideerde V1-baseline.
- `feature/real-money-ai` — V1 werk-branch (op origin).
- `claude/v2-layer-4-financial-data`, `claude/v2-layer-5-graph-drilldown`, `claude/v2-layer-6-simulation` — per-layer werkbranches (inhoud is al gemerged in `develop/v2`).
- `claude/project-analysis-next-step-6bfbef` — analyse-branch.
- Tag `v1.0.0` = gevalideerde V1-baseline (`168e05e`).

**`develop/v2` t.o.v. `main`:** 154 bestanden gewijzigd, +9.510 / −755 regels. Zwaartepunten: `src/pages` (26), `src/components` (17), `docs/v2/validation` (8+6), `src/hooks` (5), `src/spatial/*`, `src/motion/*`, `src/visualization/*`, en de nieuwe `src/financial/`, `src/core/`, `src/app/`.

**Commit-lijn (nieuwste → oudste, hoogtepunten):**

```
5ede6a8 docs(v2): status → layers 1-6 accepted + chapter registry
e7b71a6 merge(v2): Layer 6 — what-if simulation
ce00988 merge(v2): Layer 5 — 3D graph drill-down
271bdaf merge(v2): Layer 4 — real financial data in spatial nodes
98eb884 feat(v2): what-if simulation mode (Layer 6)
89c6c9e feat(v2): 3D graph drill-down (Layer 5)
955b34c feat(v2): map real financial data into spatial nodes (Layer 4)
cb98f8b feat(v2): motion and interaction engine (Layer 3)
8dc7ad1 feat(v2): visual and spatial runtime (Layer 2)
52256fb feat(v2): spatial rendering dependency foundation
2e3ecf5 feat(v2): Money Mind V2 foundation architecture
168e05e chore(v1): preserve final pre-v2 working baseline  ← v1.0.0
```

> **Migratie-veiligheid al ingebouwd:** de V1-baseline is non-destructief bewaard (`backup/v1-pre-v2` + tag `v1.0.0`) en gemerged in `develop/v2` zonder rebasing. Rollback = `git switch -c restore/v1 v1.0.0`.

---

## 2. Tech-stack & dependencies

**Runtime (`package.json` dependencies):**

- `react` ^19.2.7 · `react-dom` ^19.2.7
- `firebase` ^12.15.0 (client SDK)
- `@react-three/fiber` ^9.7.0 + `three` ^0.185.1 — **de enige 3D-dependencies; toegevoegd in de spatial-layer** (regel 5 van de foundation: dependency alleen in de layer die hem gebruikt)
- `recharts` ^3.9.2 — 2D charts (V1 visualisatie)
- `lucide-react` ^1.24.0 — iconen
- `vite-plugin-pwa` ^1.3.0

**Dev/tooling:**

- `vite` ^8.1.1 + `@vitejs/plugin-react` ^6 + `@tailwindcss/vite` ^4 + `tailwindcss` ^4
- `oxlint` ^1.71 (lint; `.oxlintrc.json`)
- `@remotion/*` + `remotion` ^4.0.489 — intro-video-compositie (`remotion/`)
- `@types/react*` — TS-types **alleen** voor tooling; `tsconfig.json` dekt alleen Remotion.

**Backend (`functions/package.json`, Node 20, CommonJS):** `firebase-admin` ^13, `firebase-functions` ^6, `openai` ^6.47.

> **Migratie-let-op:** three/R3F-versies. Een oude V2 kan op andere majors zitten (bv. R3F 8 / three 0.15x). Versie-mismatch met React 19 is een concreet migratieblok — R3F 9 is de eerste die React 19 ondersteunt.

---

## 3. V1-basis (wordt behouden)

De V1-app is een klassieke SPA met hash-routing en per-user Firestore. Behouden systemen (expliciet vastgelegd in `docs/v2/migration/v1-to-v2.md`): hash-navigatie, Firebase-init, Firebase Auth, per-user Firestore-collecties, financiële hooks/berekeningen, bestaande dashboards, Money AI, app-lock, PWA en Cloud Functions.

**Pagina's (`src/pages/`, ~26 route-schermen):** Dashboard, Budget, Bills, Transactions, Goals, DebtManager, EmergencyFund, SavingsPlanner, NetWorth, RetirementPlanner, InvestmentTracker, PortfolioDashboard, DividendDashboard/Tracker, CashFlowForecast, KPIDashboard, FinancialHealth, FinancialCalendar, Reports, Charts, ExportCenter, CurrencyCenter, InflationCalculator, LoanPayoffCalculator, AIFinancialCoach, Settings.

**Data-hooks (`src/hooks/`, 29 bestanden):** per-domein en Firestore-backed & per-user — `useAssets`, `useBudget`, `useBills`, `useDebt`, `useGoals`, `useInvestments`, `useSavings`, `useEmergencyFund`, `useRetirement`, `useTransactions`, `useMoneyMindData`, plus Money AI (`useMoneyAI`, `useMoneyAIContext`, `useFinancialCoach`), voice (`useSpeechRecognition/Synthesis`, `useVoiceConversation`) en `useAppLock`. **Nieuw in V2-context:** `useFinancialKPIs`, `useFinancialBreakdown`, `useKPIInsights`, `useKPITargets`, `useFinancialNotifications`.

**Services (`src/services/`):** `aiService.js` (Money AI client), `firestoreService.js` (Firestore-toegang), `currencyService.js`, `openaiVoiceService.js`, `biometricAuth.js`.

**Componenten/layout:** `src/components/` (37), `src/layouts/`, `src/constants/` (5), `src/utils/` (5).

> **Analogie:** V1 is een volledig ingericht, bewoond huis. V2 bouwt er een glazen serre (de 3D "spatial view") aan vast — met een eigen lichtschakelaar (feature flag). Zolang die schakelaar uit staat, merkt niemand in het huis er iets van; en de serre tapt water/stroom af via nette leidingen (adapters), niet door gaten in de bestaande muren.

---

## 4. V2-architectuur — grenzen & regels

Nieuwe `src/`-mappen introduceren strikte grenzen (uit CLAUDE.md / AGENTS.md):

- `app/` — compositie & configuratie (`app/configuration/v2.js` = één barrel-export naar flags/capabilities/motion-config)
- `core/` — cross-cutting infra → **`core/feature-flags/featureFlags.js`** (de centrale aan/uit-schakelaar)
- `financial/` — financieel domein, renderer- én Firebase-onafhankelijk → nu `financial/projection/projectFinancials.js`
- `visualization/` — renderer-neutrale adapters & modellen
- `spatial/` — spatial contracts + 3D-runtime
- `motion/` — motion policy, tokens, orchestratie
- `ai/` — V2 intelligence-grens (bestaat als map-concept; nog leeg → `v2AI` niet geïmplementeerd)
- `shared/`, `styles/` — herbruikbare code, V2 design tokens

**Zes foundation-regels (de "grondwet" van de migratie):**

1. Financiële berekeningen leven niet in rendering-componenten.
2. Renderers consumeren genormaliseerde modellen via adapters; **nooit** direct Firestore.
3. Kritieke financiële info heeft altijd een niet-spatial (V1) pad.
4. V2-flags standaard uit; child-flags vereisen `VITE_V2_ENABLED=true`.
5. Voeg een dependency alleen toe in de layer die hem direct gebruikt.
6. Verander nooit Firebase-schema's of financiële berekeningen als neveneffect van visueel werk.

**ADRs (`docs/v2/architecture/decisions/`):** 0001 V1→V2 upgrade-strategie · 0002 financial-domain-isolatie · 0003 spatial-rendering-isolatie · 0004 progressive enhancement · 0005 chapter-traceability.

---

## 5. Feature flags (de migratie-veiligheidsklep)

`src/core/feature-flags/featureFlags.js` — zes flags, immutable (`Object.freeze`), afgeleid van `import.meta.env`:

| Flag | Env-var | Vereist master |
|---|---|---|
| `v2Enabled` | `VITE_V2_ENABLED` | — (master) |
| `v2SpatialUI` | `VITE_V2_SPATIAL_UI` | ✔ |
| `v2GraphEngine` | `VITE_V2_GRAPH_ENGINE` | ✔ |
| `v2MotionEngine` | `VITE_V2_MOTION_ENGINE` | ✔ |
| `v2Simulation` | `VITE_V2_SIMULATION` | ✔ |
| `v2AI` | `VITE_V2_AI` | ✔ |

Elke child-flag is `v2Enabled && readBoolean(child)` — één master-switch schakelt alles uit. `.env.example` levert veilige defaults (alles `false`). **Live blijft dus V1** zolang `.env` V2 niet inschakelt.

---

## 6. V2-layers in detail (huidige staat)

### Layer 1 — Foundation
Feature flags, spatial contracts (`src/spatial/contracts.js`: `SpatialNode`/`SpatialEdge`/`SpatialScene` typedefs, `VISUALIZATION_MODES`, `RENDERING_QUALITIES`, `MOTION_PREFERENCES`), motion-tokens, rendering-capability-detectie, ADRs, chapter-registry. Zuiver contract-/config-werk, geen runtime-gedrag.

### Layer 2 / 2C — Spatial & Visual Runtime
`src/spatial/` (20 bestanden). Entry: **`SpatialExperience.jsx`** — lazy-load van de runtime, WebGL-capability-check met nette **fallback** ("financiële info blijft beschikbaar in het standaard dashboard" → foundation-regel 3), en een `SpatialErrorBoundary`. Runtime onder `spatial/runtime/`: `core/` (`SpatialCanvas`, `SpatialRuntime`, `runtimeConfig`), `camera/` (`CameraRig`, `cameraUtils`), `nodes/` (`SpatialNode`, `NodeGroup`, `NodeLabels`, `nodeMaterials`), `edges/`, `lighting/`, `scene/`, `quality/` (`qualityPresets`), plus `performance/capabilities.js`. Layer 2C leverde visuele acceptatie met screenshots (desktop/laptop/tablet/mobiel/WebGL-fallback) in `docs/v2/validation/screenshots/layer-2c/`.

### Layer 3 — Motion & Interaction Engine
`src/motion/` (14 bestanden). **`MotionProvider.jsx`** = state-machine voor scene-toestanden (overview/hovering/selection/reset) met transition-timers en intents (`selectNode`, `hoverNode`, `clearHover`, `resetView`). Beleid & toegankelijkheid in `accessibility/motionPolicies.js` (respecteert `prefers-reduced-motion`; preferences full/reduced/minimal/off). Tokens in `transitions/motionTokens.js`. Choreografie per element: `nodes/nodeMotion.js`, `camera/cameraMotion.js`, `edges/edgeMotion.js`, `radial/` en `orchestration/transitionSequences.js`. Animatiebudget in `performance/animationBudget.js`.

### Layer 4 — Echte financiële data in spatial nodes
`src/visualization/adapters/financialSpatialAdapter.js` (`createFinancialSpatialScene`). **Pure adapter**: normalized financieel model → renderer-neutrale `SpatialScene`; raakt nooit Firebase, formatteert zelf geen valuta. Zes domeinen (income, investments, assets, debt, expenses, savings) op een radiale ring rond een "Financial Core"-node; node-grootte = aandeel t.o.v. grootste domein met vloer `MIN_MAGNITUDE = 0.35`. Gevoed door `useFinancialKPIs` (pure KPI-selector, memoized). Contract-assert via `assertSpatialScene`.

### Layer 5 — Graph drill-down
`src/hooks/useFinancialBreakdown.js` — pure per-domein line-item selector (leest reeds-geladen hook-arrays; geen Firestore). Sorteert aflopend, capt op `MAX_CHILDREN = 8` met een "+N more"-staart. Adapter voegt per domein `children` toe als `kind:"child"`-nodes op een ring rond de domein-node; alleen de child-tak van `resolveNodeMotion` is nieuw. Flag: `v2GraphEngine`. Onderweg gefixt: `#spatial`-route-guard voor ingelogde user + R3F `raycast`-toggle waardoor child-nodes klikbaar werden.

### Layer 6 — Simulatie ("what-if")
`src/financial/projection/projectFinancials.js` — **nieuwe, bewust van V1 gescheiden** projectie-wiskunde (het actual-data-pad loopt hier nooit doorheen → regel 6). Levers: `monthsForward`, `extraDebtPayment`, `extraMonthlySaving`, `annualReturnPct`, `oneOff`. Bij `monthsForward=0` en alle levers 0 = output gelijk aan input (geen sprong bij inschakelen). Scene krijgt `projected`/`monthsForward` mee zodat de runtime een amber "Projection · +N mo"-badge toont. Flag: `v2Simulation`; uit = exact Layer 5.

### v2AI — nog niet geïmplementeerd
Flag `v2AI` bestaat; `src/ai/` is leeg. Money AI (V1) blijft ongewijzigd. Dit is de aangewezen **NEXT**-layer, of het productionizen van de spatial view (echte nav-entry i.p.v. dev-only `#spatial`).

---

## 6b. Routing, auth & integratie in `src/App.jsx`

`App.jsx` (~1.027 regels) bezit hash-routing (`#route`), top-level orchestratie en enkele berekeningen — een bekend refactor-doel (incrementeel decomponeren zodra regressie-dekking bestaat). V2-integratie is netjes flag-gated:

- `DEVELOPMENT_PAGES = new Set(featureFlags.v2SpatialUI ? ["spatial"] : [])` — de `#spatial`-route bestaat alleen als de flag aan is.
- Signed-out demo: `activePage === "spatial"` → `<SpatialExperience />` (mock proof-scene).
- Signed-in: `spatialFinancialModel` (memoized) uit `useFinancialKPIs` + optioneel `useFinancialBreakdown` (alleen als `v2GraphEngine`) + optioneel `projectFinancials` (alleen als `v2Simulation`) → `<SpatialExperience model=… sim=… />`.
- Auth: Firebase Auth ongewijzigd; kritieke info altijd via V1-pad bereikbaar.

---

## 6c. Firebase, backend & security

- **`firebase.json`:** hosting (`site: money-mind-90176`, `public: dist`, SPA-rewrite naar `/index.html`), firestore (rules + indexes), functions (source `functions`).
- **`.firebaserc`:** default project `money-mind-90176`. Live: https://money-mind-90176.web.app.
- **`firestore.rules`:** alle data onder `users/{userId}/{document=**}`; lezen/schrijven alleen als `request.auth.uid == userId`. Alles anders default-deny. **Niet wijzigen als neveneffect van visueel werk** (regel 6).
- **Cloud Functions (`functions/index.js`, ~26 KB):** `agentQuery` en `moneyAIVoiceSynthesize` (callable v2 functions, region `us-central1`, OpenAI via `defineSecret("OPENAI_API_KEY")` — sleutel nooit in de client-bundle). `firestore.indexes.json` is minimaal.

---

## 6d. Tests, validatie & build

- **Geen test-framework** (geen vitest/jest, geen `test`-script). Kwaliteitsborging = **browser-validatie** met bewijs per layer in `docs/v2/validation/*.md` + screenshots. Dit is de grootste kwaliteits-/migratie-risicopost: er is geen geautomatiseerde regressie-vangnet.
- **Typecheck:** niet beschikbaar voor de app (TS dekt alleen Remotion); types via JSDoc-typedefs.
- **Lint:** `oxlint` — slaagt met bekende, niet-blokkerende warnings.
- **Build:** `vite build` → `dist/` (V1-safety-baseline: 2.460 modules, service worker gegenereerd; één chunk >500 kB). **Opgelet in cloud-sessie:** build faalt in de Linux-sandbox (native `rolldown`-binding is Windows-geïnstalleerd) en Firebase/Google-endpoints zijn geblokkeerd → **build & deploy draaien op de Windows-machine**.
- Deploy: `npm run deploy` (hosting-only) of `deploy:full` (incl. rules + functions).

---

## 7. Deel B — Vergelijking met de oude V2 (`Money-Mind-V2.0-3D`)

### 7.1 Wat de oude V2 werkelijk is

De ZIP bevat een **greenfield herbouw**, geen uitbreiding van V1: **Next.js 16 (App Router, React Server Components) + TypeScript 6 (strict) + Tailwind 4 + Radix UI**. Firebase alleen client-side (`NEXT_PUBLIC_*`, geen Cloud Functions). Eigen "Layer 0–5"-nummering die **niets** te maken heeft met de layers 1–6 van `develop/v2`:

| Oude-V2 layer | Inhoud | Staat |
|---|---|---|
| 1 | Design system: tokens (`styles/tokens.css`), glass-materials, UI-primitives (Radix) | ✅ echt |
| 2 | Application shell: sidebar + mobile nav uit één typed `config/navigation.ts`, topbar, breadcrumbs | ✅ echt |
| 3 | Auth: `AuthProvider`, guards, email/password + Google, verify-email, forgot-password, `auth-service` | ✅ echt |
| 4 | Onboarding + profiel: `ProfileProvider`, onboarding-guard, resumable onboarding-flow | ✅ echt |
| 5 | Financieel **domein**: getypeerde schema's, minor-unit money-math, rates/dates/transfers, validation, repository-contracts + Firestore-padhelper | ✅ echt (alleen domein, geen UI) |
| 6–8 | Alle financiële **features** (dashboard, transactions, budget, …) | ⛔ **placeholders** ("implemented in Layer N") |
| — | **3D / WebGL** (`three/`) | ⛔ **leeg** — alleen een README ("reserved for optional WebGL") |

**Twee harde conclusies:**

1. **De oude "3D-V2" heeft geen 3D.** Ondanks de repo-naam is `three/` een lege gereserveerde map. De 3D-visualisatie bestaat *alleen* in `develop/v2` (layers 2–6, R3F daadwerkelijk geïmplementeerd). Hier valt dus **niets** te migreren — `develop/v2` loopt ver voor.
2. **De oude V2 heeft geen features.** Elke dashboard-pagina is een `ModulePlaceholder`. De echte financiële functionaliteit zit in V1/`develop/v2` (27 schermen, Firestore-hooks, Money AI + Cloud Functions). Ook hier: niets te migreren *aan features*.

Wat de oude V2 wél heeft en `develop/v2` niet, is **architectonische discipline**: een strak getypeerd domein, een design-system, en auth/onboarding-UX. Dat zijn **oogst-kandidaten** (ideeën/assets her-implementeren), geen merge-kandidaten — de stacks (Next.js/RSC/TS vs Vite-SPA/JS) zijn onverenigbaar en de opdracht is expliciet "bovenop V1 bouwen".

### 7.2 Gap-matrix

Legenda: **✅ Gemigreerd/aanwezig** · **🟡 Deels/anders** · **❌ Ontbrekend (oogst-kandidaat)** · **♻️ Dubbel** · **⛔ Niet migreren**

| # | Capability oude V2 | In develop/v2 / V1? | Classificatie | Actie |
|---|---|---|---|---|
| 1 | Next.js 16 App Router + RSC runtime | Nee (Vite-SPA) | ⛔ Niet migreren | Stack-conflict; zou V1 breken. Blijf op Vite. |
| 2 | TypeScript 6 strict + `tsc` typecheck | Nee (JS + JSDoc) | ❌ Ontbrekend | Overweeg incrementeel JSDoc-typecheck of `.ts` in nieuwe modules; geen big-bang-conversie. |
| 3 | Tailwind 4 | Ja (beide) | ✅ Aanwezig | Geen actie. |
| 4 | Design-system tokens — `mm-*` obsidian/emerald/mint/gold palet, spacing, motion, shadows, radii | Eigen V2-tokens (`src/styles`), anders | 🟡 Deels | **Oogst als visuele taal.** Port `tokens.css` naar de V2 design-tokens; sterkste losse asset. |
| 5 | Glass-materials + Radix UI-primitives (Button, Dialog, Select, Tooltip, …) | Eigen componenten + lucide | 🟡 Deels | Oogst de glass-CSS; Radix optioneel (voegt deps toe) — selectief. |
| 6 | App-shell + nav uit één typed config (Core/Wealth/Intelligence/System) | `App.jsx` hash-routing + eigen nav | 🟡 Deels | Oogst de nav-**taxonomie**; niet de Next-shell. Past bij "productionize spatial view / echte nav-entry". |
| 7 | Auth: email/pw + Google, verify-email, forgot-password, guards | V1 Firebase Auth werkt al | ♻️ Dubbel | V1-auth blijft leidend. Oogst alleen ontbrekende UX-flows (verify-email/forgot-password) indien V1 die mist. |
| 8 | Onboarding + profielvoorkeuren (resumable) | Onbekend/waarschijnlijk afwezig in V1 | ❌ Ontbrekend | Kandidaat-feature; her-implementeer in V1-stijl als nieuwe pagina/flow. |
| 9 | Money-domein: **integer minor-units** math, currency-safety, parse/format, rates, dates, transfers | V1 rekent met floats in hooks | ❌ Ontbrekend | **Hoogwaardige oogst.** Her-implementeer als pure JS in `src/financial/` (naast `projectFinancials`); vervang floats gefaseerd. |
| 10 | Canonieke getypeerde finance-schema's (`types/finance/*`) | Ad-hoc shapes in hooks | ❌ Ontbrekend | Oogst als documentatie/JSDoc-typedefs + runtime-validation. |
| 11 | Repository-pattern + user-scoped Firestore-padhelper `users/{uid}/{col}` | `firestoreService` direct; rules al `users/{uid}/**` | 🟡 Deels | Model is **compatibel** (geen schema-conflict). Oogst de repository-abstractie optioneel. |
| 12 | Firestore-collectie-taxonomie (accounts, categories, goalContributions, debtPayments, holdings, recurringTransactions, financialHealthSnapshots, aiInsights) | V1: budgets/transactions/assets/liabilities/goals/debts/savingsPlans/bills/investments | 🟡 Deels — **divergent** | Reconcilieer op papier; **wijzig V1-schema niet als neveneffect** (regel 6). Nieuwe collecties alleen per chapter. |
| 13 | Financiële features (dashboard, transactions, budget, …) | Volledig in V1/`develop/v2` | ✅ Aanwezig (V1 voor) | Niets te migreren; oude V2 = placeholders. |
| 14 | 3D / R3F spatial experience | Volledig in `develop/v2` (L2–6) | ✅ Aanwezig (`develop/v2` voor) | Niets te migreren; oude `three/` is leeg. |
| 15 | Money AI | V1 `aiService` + Cloud Functions | ✅ Aanwezig (V1 voor) | Niets te migreren; oude AI = placeholder. |
| 16 | Cloud Functions backend (server-side secrets) | `develop/v2` (agentQuery, voice) | ✅ Aanwezig (`develop/v2` voor) | Niets te migreren; oude V2 heeft geen functions. |
| 17 | Tests: `node --experimental-strip-types` units + Playwright QA-scripts | **Geen** in `develop/v2` | ❌ Ontbrekend | **Oogst de aanpak.** Begin met domein-/money-units; hét ontbrekende vangnet. |
| 18 | Firebase-config-validatie (`isFirebaseConfigured`) | `firebase.js` init | 🟡 Deels | Kleine oogst; nette guard. |
| 19 | Secret-discipline (geen keys in client) | `VITE_` + Functions `defineSecret` | ✅ Gelijkwaardig | Geen actie. |

### 7.3 Expliciet NIET migreren (met reden)

| Item oude V2 | Reden |
|---|---|
| `next.config.ts`, `proxy.ts`, `eslint-config-next`, `postcss.config.mjs`, `app/` RSC-structuur | Next.js-stack; onverenigbaar met de Vite-SPA bovenop V1. |
| 1:1 `.ts`/`.tsx`-bestanden overnemen | `develop/v2` is JS+JSDoc; kopiëren dwingt een stack-migratie af die de opdracht niet vraagt. |
| `lib/firebase/client.ts` + eigen `AuthProvider`/`auth-service` | V1 heeft werkende Firebase-init + Auth; tweede init = conflict. |
| Alle `ModulePlaceholder`-pagina's | Bevatten geen functionaliteit. |
| `three/` "boundary" | Leeg; `develop/v2` heeft de echte runtime al. |
| Radix als harde afhankelijkheid overal | Alleen selectief oogsten; anders onnodige dependency-last (regel 5). |

---

## 8. Deel C — Aanbevolen oogst-/migratie-volgorde

De oude V2 levert **assets en specificaties**, geen code-merge. Voer als kleine, flag-veilige stappen uit, in `develop/v2`-stijl (elk met validatie-evidence; `main` onaangeroerd):

1. **Testvangnet eerst** (blokkeert al het andere). Neem de test-aanpak van de oude V2 over voor de pure functies die er al zijn: `useFinancialKPIs`, `useFinancialBreakdown`, `projectFinancials`, de adapters. Dit is óók de voorwaarde uit de docs om `App.jsx` later te decomponeren.
2. **Money-domein oogsten** (`#9`/`#10`). Her-implementeer de minor-unit money-math + currency/validatie als pure JS in `src/financial/`, met de oude tests als vertrekpunt. Documenteer de canonieke schema's als JSDoc-typedefs. Vervang float-berekeningen gefaseerd, achter bestaand gedrag.
3. **Design-tokens oogsten** (`#4`/`#5`). Breng het `mm-*`-palet/materials over naar de V2 design-tokens (`src/styles`). Zuiver visueel, past onder de bestaande flags.
4. **Schema-taxonomie reconciliëren op papier** (`#12`). Leg de mapping V1 ↔ oude-V2-collecties vast (bv. `savingsPlans`↔`goals`, `investments`↔`holdings`) vóór er ook maar iets aan Firestore verandert. Nieuwe collecties alleen als expliciete chapter.
5. **Ontbrekende features als nieuwe chapters** (`#8`, evt. verify-email/forgot-password UX). Onboarding-flow her-implementeren in V1-stijl; alleen wat V1 mist.
6. **Nav-taxonomie** (`#6`) meenemen wanneer de spatial view geproductioniseerd wordt (echte nav-entry i.p.v. dev-only `#spatial`).

> **Analogie.** `develop/v2` is een bewoond, verbouwd huis met een werkende serre (3D). De oude V2 is een prachtige, gedetailleerde **maquette** van een ander huis: mooie materialen (tokens), een strak leidingplan (domein-typen) en een nette voordeur (auth) — maar zonder meubels (features) en zonder de serre. Je verhuist niet naar de maquette; je neemt de materialen en het leidingplan mee naar je echte huis.

---

## 9. Belangrijkste risico's

1. **Geen geautomatiseerde tests in `develop/v2`.** Grootste risicopost; stap 1 hierboven adresseert dit. De oude V2 levert de aanpak kant-en-klaar.
2. **Schema-divergentie (`#12`).** De oude V2 normaliseert rijker (accounts/categories/holdings/…). Klakkeloos overnemen schendt regel 6. Eerst mappen, dan per chapter.
3. **Stack-verleiding.** De oude V2 is technisch "moderner" (Next/TS/RSC). Overstappen betekent V1 weggooien — tegen de opdracht in. Oogsten, niet migreren.
4. **`App.jsx` (~1.027 regels)** blijft concentratiepunt; nieuwe features strikt flag-gated integreren.
5. **Build/deploy alleen op Windows** (native binding + geblokkeerde Firebase-endpoints in de sandbox).
6. **`main` onaangeroerd** — geborgd via `backup/v1-pre-v2` + tag `v1.0.0`; alle V2-werk op `develop/v2`, V2 default uit.

---

*Einde rapport. Bronnen: `develop/v2` werkende tree + `MoneyMindV2.03Dmain.zip` (150 bronbestanden).*
