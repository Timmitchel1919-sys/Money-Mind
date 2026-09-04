# Layer 3 motion and interaction validation

- Date: 2026-08-21
- Branch: `develop/v2`
- Starting commit: `dd8f618`
- Browser: cached Playwright 1.62.1 with Chromium 151.0.7922.34
- Route: `http://127.0.0.1:4180/#spatial`
- Feature flags: temporary process-only V2 and spatial flags

The integrated Browser runtime was attempted first and again returned `No browser is available` with an empty browser list. The established Layer 2C Playwright/Chromium fallback was reused without installation or download.

## Motion policy matrix

| Scenario | Full | Reduced | Minimal | Off |
| --- | --- | --- | --- | --- |
| Overview entry | PASS | PASS | PASS | PASS |
| Hover | PASS | PASS | PASS | PASS |
| Select | PASS | PASS | PASS | PASS |
| Focus | PASS WITH CORRECTION | PASS | PASS | PASS |
| Switch node | PASS | PASS | PASS | PASS |
| Reset | PASS | PASS | PASS | PASS |
| Interrupt selection | PASS | PASS | PASS | PASS |
| Interrupt reset | PASS | PASS | PASS | PASS |

Full mode exposed `selecting`, `switching`, and `resetting` before settling. Reduced/minimal modes settled on their shorter policy durations. Off mode settled immediately as designed. Every mode finished with the last requested node or overview and no stale selection.

## Corrections from browser evidence

1. Reduced core scale/opacity and increased selected-domain scale in focused state so the selected financial domain owns visual priority.
2. Reduced camera travel by policy after mobile focus placed most of the Financial Core outside the frame. The corrected framing preserves both the core and selected domain across desktop and mobile.

## Interaction and state evidence

- Overview → Assets produced `selecting` → `focused`.
- Focused Assets → Savings produced `switching` → focused Savings without overview reset.
- Assets followed immediately by Debt cancelled/retargeted and settled focused on Debt.
- Savings/switch followed immediately by Reset settled at overview with `Financial overview`.
- Hover during selection remained responsive without changing the active selection transition.
- Enter selected Assets; Space deselected it; Tab and Shift+Tab traversed adjacent labels without a focus trap.
- Pointer, keyboard, toolbar reset, deselection, and empty Canvas share semantic intent handling.

## Responsive and Layer 2C regression

| Check | Result | Evidence |
| --- | --- | --- |
| Canvas/WebGL | PASS | Live Canvas and WebGL context in Chromium |
| Desktop 1600×900 | PASS | No overflow; all labels inside stage |
| Laptop 1366×768 | PASS | No overflow; all labels inside stage |
| Tablet 768×1024 | PASS | No overflow; all labels inside stage |
| Mobile 360×800 | PASS WITH CORRECTION | Core and selected domain remain in focused frame |
| Node placement/labels/edges | PASS | Overview matches accepted Layer 2C composition |
| Quality modes | PASS | Auto/low/medium/high/ultra reported expected preset and DPR |
| Camera reset | PASS | Restored overview framing and inspector state |
| WebGL fallback | PASS | Forced WebGL denial rendered fallback with zero Canvas |

## Console

No React error, WebGL error, cancellation error, memory warning, or runtime exception occurred. The sandbox denied the external Google Fonts stylesheet; system fonts rendered. The existing R3F/Three stack emitted its known `THREE.Clock` deprecation warning.

## Static verification

| Check | Result |
| --- | --- |
| Dependency verification | PASS; no package change |
| Lint | PASS WITH EXISTING WARNINGS; eight unchanged V1 warnings |
| Production build | PASS |
| Pure-module syntax | PASS |
| Application startup | PASS |
| PWA generation | PASS |
| Tests | UNAVAILABLE |
| Typecheck | UNAVAILABLE |

## Bundle impact

| Bundle | Layer 2C | Layer 3 | Difference |
| --- | ---: | ---: | ---: |
| Initial JS | 1,525.64 / 439.75 kB gzip | 1,526.88 / 440.11 kB gzip | +1.24 / +0.36 kB gzip |
| Spatial/motion JS | 891.40 / 237.69 kB gzip | 896.53 / 239.24 kB gzip | +5.13 / +1.55 kB gzip |
| Spatial CSS | 5.97 / 1.88 kB gzip | 6.30 / 1.99 kB gzip | +0.33 / +0.11 kB gzip |

The motion code remains in the lazy spatial chunk. GSAP and all alternative animation packages remain deferred.

## Decision

**LAYER 3 ACCEPTED**

---

## Deterministic harness rerun (2026-09-02)

- Harness: `scripts/v2/layer3-browser-acceptance.mjs`
- Command: `npm run validate:layer3`
- Browser: Chrome `152.0.7977.65` via `playwright-core` `1.62.1` (headless)
- Route: `http://127.0.0.1:4178/#spatial`
- Flags during harness run: `VITE_V2_ENABLED=true`, `VITE_V2_SPATIAL_UI=true`, `VITE_V2_AI=false`

### Harness matrix

| Test | Result | Evidence |
| --- | --- | --- |
| Initialization (Canvas/WebGL/core/domains/labels) | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Hover (all six domains) | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Selection (all six domains) | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Deselect | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Node switching | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Rapid interruption loops | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Keyboard (Tab/Enter/Space/reset) | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Camera focus + reset (observable state) | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Motion policy full | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Motion policy reduced | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Motion policy minimal | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Motion policy off | PASS | `docs/v2/validation/layer-3-harness-report.json` |
| Desktop 1920×1080 | PASS | `docs/v2/validation/screenshots/layer-3/desktop-1920x1080.png` |
| Laptop 1366×768 | PASS | `docs/v2/validation/screenshots/layer-3/laptop-1366x768.png` |
| Tablet 768×1024 | PASS | `docs/v2/validation/screenshots/layer-3/tablet-768x1024.png` |
| Mobile 390×844 | PASS | `docs/v2/validation/screenshots/layer-3/mobile-390x844.png` |
| Console/pageerror inspection | PASS (known `THREE.Clock` warning only) | `docs/v2/validation/layer-3-harness-report.json` |
| WebGL fallback | PASS | `docs/v2/validation/screenshots/layer-3/webgl-fallback.png` |
| Layer 2C regression set | PASS | harness report + screenshot set above |

### Harness screenshots (required set)

- `docs/v2/validation/screenshots/layer-3/desktop-overview.png`
- `docs/v2/validation/screenshots/layer-3/desktop-selected.png`
- `docs/v2/validation/screenshots/layer-3/desktop-focused.png`
- `docs/v2/validation/screenshots/layer-3/desktop-switching.png`
- `docs/v2/validation/screenshots/layer-3/mobile-390x844.png`
- `docs/v2/validation/screenshots/layer-3/mobile-selected.png`
- `docs/v2/validation/screenshots/layer-3/reduced-motion-state.png`
- `docs/v2/validation/screenshots/layer-3/off-motion-state.png`
- `docs/v2/validation/screenshots/layer-3/webgl-fallback.png`
