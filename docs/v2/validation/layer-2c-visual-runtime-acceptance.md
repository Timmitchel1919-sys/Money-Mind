# Layer 2C visual runtime acceptance

- Date: 2026-08-21
- Branch: `develop/v2`
- Starting commit: `05ee76e`
- Route: `http://127.0.0.1:4178/#spatial`
- Feature configuration: `VITE_V2_ENABLED=true`, `VITE_V2_SPATIAL_UI=true` for the temporary development process only
- Decision: **ACCEPTED**

## Historical blocked result

The first Layer 2C attempt at commit `8dc7ad1` was correctly recorded as **NOT ACCEPTED** because the integrated Browser runtime returned zero sessions and no authorized fallback was available. That result remains part of the project history in commit `05ee76e`; it has not been reinterpreted as a pass.

The browser-enablement continuation again proved that the integrated runtime had zero connected sessions, then used the newly authorized fallback described in `browser-validation-enablement.md`. A real Chromium 151 session initialized WebGL, rendered the application, and supplied interaction, console, responsive, and screenshot evidence.

## Acceptance matrix

| Test | Status | Correction | Evidence |
| --- | --- | --- | --- |
| Canvas initialization | PASS | None | Canvas reached `data-context-state="ready"`; WebGL context returned true |
| Desktop 16:9 | PASS | Increased overview camera distance | 1600×900 rendered without clipping or horizontal overflow |
| Laptop | PASS | Covered by overview correction | 1366×768 rendered without clipping or overflow |
| Tablet | PASS | None | 1024×768 and 768×1024 rendered; all seven labels remained inside the stage |
| Mobile | PASS | None | 390×844 and 360×800 rendered; no horizontal overflow |
| Central core | PASS | None | Core is visually distinct, centered, and labelled |
| Radial spacing | PASS | Overview framing correction | Six domain nodes remain evenly distributed around the core |
| Node hierarchy | PASS | None | Core size/label treatment remains stronger than radial nodes |
| Labels | PASS | None | Seven labels visible; responsive bounds checks passed |
| Edges | PASS | None | Six core-to-domain edges visible across tested viewports |
| Hover | PASS | None | Pointer hover applied `is-hovered` and visible label emphasis |
| Keyboard | PASS | None | Tab, Shift+Tab, Enter, and Space navigated/toggled labels |
| Select/deselect | PASS | None | Assets changed `aria-pressed` and inspector; second activation deselected |
| Camera focus | PASS | None | Assets selection produced the focused-node frame and enabled controls |
| Camera reset | PASS | None | Reset returned inspector to `Financial overview` |
| Quality | PASS | None | Auto/low/medium/high/ultra resolved live with DPR 1.5/1/1.25/1.5/2 |
| Motion modes | PASS | Added development-only query selector | Full/reduced/minimal/off each rendered and reported its active mode |
| WebGL fallback | PASS | Styled capability fallback outside lazy runtime CSS | Forced WebGL denial rendered standard-dashboard guidance and no Canvas |

## Corrections made from observed evidence

1. Increased the overview camera Z position from 7.4 to 9.4 so vertical radial nodes and spheres remain inside wide, shallow stages.
2. Added a development-only `?spatialMotion=` selector for exercising the runtime's existing full, reduced, minimal, and off modes. Production behavior continues to derive motion from device preference.
3. Added independently loaded fallback styling so the no-WebGL path remains visually coherent when the lazy runtime stylesheet is never requested.

## Console and network evidence

- No application exception, React error, framework overlay, or failed local application asset was observed.
- The sandbox denied the Google Fonts stylesheet request; system-font fallbacks rendered successfully. This is an environment network restriction, not a spatial runtime failure.
- Software-rendered Chromium emitted its own SwiftShader warning.
- Three.js emitted the known `THREE.Clock` deprecation warning through the current R3F stack; it did not affect rendering or interaction.

## Screenshots

Validation artifacts are in `docs/v2/validation/screenshots/layer-2c/`:

- `desktop-wide.png`
- `laptop.png`
- `tablet-portrait.png`
- `mobile-narrow.png`
- `focused-node.png`
- `webgl-fallback.png`

## Technical verification

| Check | Status | Evidence |
| --- | --- | --- |
| Repository safety | PASS | Began clean on `develop/v2` at `05ee76e`; V1 tag/backup unchanged |
| Browser enablement | PASS | Cached Playwright 1.62.1 drove cached Chromium 151.0.7922.34; no install/download |
| Lint | PASS WITH EXISTING WARNINGS | Eight unchanged V1 warnings; no new warning |
| Production build | PASS | Vite 8.1.3; 2,498 modules transformed; PWA generated |
| Dependency churn | PASS | No manifest or lockfile change |

## Bundle comparison

| Bundle | Layer 2 baseline | Accepted result | Difference |
| --- | ---: | ---: | ---: |
| Main JS | 1,525.56 kB / 439.77 kB gzip | 1,525.64 kB / 439.75 kB gzip | +0.08 kB / -0.02 kB gzip |
| Spatial JS | 891.41 kB / 237.69 kB gzip | 891.40 kB / 237.69 kB gzip | -0.01 kB / 0 kB gzip |
| Spatial CSS | 5.97 kB / 1.88 kB gzip | 5.97 kB / 1.88 kB gzip | 0 |

## Final decision

**BROWSER VALIDATION ENABLED**

**LAYER 2C ACCEPTED**

The visual and spatial runtime foundation is ready for Layer 3.
