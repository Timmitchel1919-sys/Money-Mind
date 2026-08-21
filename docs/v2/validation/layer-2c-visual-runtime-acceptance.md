# Layer 2C visual runtime acceptance

- Date: 2026-08-21
- Branch: `develop/v2`
- Starting commit: `8dc7ad1`
- Route: `http://127.0.0.1:4177/#spatial`
- Feature configuration: `VITE_V2_ENABLED=true`, `VITE_V2_SPATIAL_UI=true` for the temporary development process only
- Decision: **NOT ACCEPTED**

## Blocking condition

The real application started and returned HTTP 200, but the Browser runtime reported no available browser sessions. Therefore no real browser could initialize or inspect the WebGL Canvas. Per Layer 2C requirements, source inspection, pure-policy checks, and successful builds are not substitutes for real visual and interaction evidence.

No Playwright or unrelated browser fallback was used because the available Browser workflow failed and no fallback authorization was provided. No screenshots were produced.

## Acceptance matrix

| Test | Status | Correction | Notes |
| --- | --- | --- | --- |
| Canvas initialization | BLOCKED | None | No browser session; real WebGL initialization unverified |
| Desktop 16:9 | BLOCKED | None | 1920×1080 / 1600×900 not rendered |
| Laptop | BLOCKED | None | 1366×768 / 1440×900 not rendered |
| Tablet | BLOCKED | None | 1024×768 / 768×1024 not rendered |
| Mobile | BLOCKED | None | 390×844 / 360×800 not rendered |
| Central core | BLOCKED | None | Requires rendered visual inspection |
| Radial spacing | BLOCKED | None | Requires rendered visual inspection |
| Node hierarchy | BLOCKED | None | Requires rendered visual inspection |
| Labels | BLOCKED | None | Requires rendered visual and focus inspection |
| Edges | BLOCKED | None | Requires rendered visual inspection |
| Hover | BLOCKED | None | Requires real pointer interaction |
| Keyboard | BLOCKED | None | Requires Tab/Shift+Tab/Enter/Space interaction |
| Select/deselect | BLOCKED | None | Requires rendered interaction and state evidence |
| Camera focus | BLOCKED | None | Requires rendered interaction and frame evidence |
| Camera reset | BLOCKED | None | Requires rendered interaction and frame evidence |
| Quality | BLOCKED | None | Requires live Canvas switching across all presets |
| Motion modes | BLOCKED | None | Requires live full/reduced/minimal/off verification |
| WebGL fallback | BLOCKED | None | Real browser fallback could not be forced and inspected |

## Technical checks completed

| Check | Status | Evidence |
| --- | --- | --- |
| Repository safety | PASS | Clean `develop/v2` at `8dc7ad1` before this document |
| Development startup | PASS | Vite ready; route returned HTTP 200 with application root |
| Dependency verification | PASS | npm tree resolves, including Three.js 0.185.1 and R3F 9.7.0 |
| Lint | PASS WITH EXISTING WARNINGS | Eight known V1 warnings; no new acceptance warning |
| Production build | PASS | 2,497 modules transformed |
| Syntax checks | PASS | Runtime/configuration JavaScript passed `node --check` |
| PWA generation | PASS | Service worker and Workbox runtime generated |
| Dependency churn | PASS | No manifest or lockfile changes |

## Bundle comparison

| Bundle | Layer 2 baseline | Layer 2C result | Difference |
| --- | ---: | ---: | ---: |
| Main JS | 1,525.56 kB / 439.77 kB gzip | 1,525.56 kB / 439.77 kB gzip | 0 |
| Spatial JS | 891.41 kB / 237.69 kB gzip | 891.41 kB / 237.69 kB gzip | 0 |
| Spatial CSS | 5.97 kB / 1.88 kB gzip | 5.97 kB / 1.88 kB gzip | 0 |

## Corrections

No acceptance corrections were made because no rendered defect could be observed or reproduced without a browser. Making speculative visual changes would violate the correction-only scope.

## Required continuation

Connect an in-app Browser or authorized browser-testing fallback, then rerun all 18 acceptance cases, capture the six requested screenshot states, correct only observed defects, and replace blocked statuses with evidence-backed results. Until then, Layer 2C remains not accepted.
