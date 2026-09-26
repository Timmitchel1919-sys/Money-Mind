# Chapter 7: Spatial Financial Universe validation

- Date: 2026-09-26
- Branch: `develop/v2` (starting HEAD `6105f97`)
- Architecture: `docs/v2/architecture/spatial-financial-universe.md`

## Roadmap check

The owner's brief called this "Layer 5 — Spatial Financial Universe". The
repository has no such entry: chapter/layer 5 is the accepted Graph
Drill-down, and the documented next step was v2AI or productionizing the
spatial view. The discrepancy was reported before implementation. The owner
chose to register the work as **chapter 7**; no existing chapter was renamed
or renumbered.

## Automated

| Suite | Result |
| --- | --- |
| `test:spatial-universe` (new) | 231 assertions PASS: spotlight tiers in all 4 motion policies for two domains and a child; dimming never hides or blacks out; exact restore on exit; selection/hover/core priority; hidden children unaffected; palette brightness, saturation and hue separation vs the old palette; quality → material tiers |
| Financial domain, projection, parity, authority, hooks | PASS |
| Graph 4A / 4B / 4C / 4D / builder | 25 / 77 / 105 / 340 / 129 PASS |
| Lint / build | 0 errors, no new warnings / PASS |

One test defect was fixed: in OFF motion, Layer 3 applies no scale travel,
so "selection keeps a larger scale" only applies to policies that animate
scale.

## Browser: signed in, real data, graph-built scene

Chrome 153 over CDP. The flags were set in the dev process only. Values below
were read from the live Three.js materials through the R3F root; hover used a
real mouse over the projected 3D ball positions.

| Check | Result |
| --- | --- |
| Materials at auto/high | `MeshPhysicalMaterial`, clearcoat 1, environment on (0.85) |
| Hover Income (domain) | hovered luminance 0.411 → 0.597, emissive 0.42 → 1.9; all other visible nodes dim (e.g. 0.253 → 0.101, emissive → 0.1, opacity 0.55); exact restore |
| Hover Debt (domain) | 0.255 → 0.37; others dim; exact restore |
| Hover a revealed investment holding (child) | 0.253 → 0.367; the selected Investments domain stays above the dimmed nodes; exact restore; the selection is unchanged by hover |
| Expanded domain | 4 children revealed on selecting Investments |
| Keyboard | focus-visible spotlight (0.607 vs 0.173); Enter selects |
| Motion policies | spotlight progress at 60 ms: FULL 0.46, REDUCED 0.58, MINIMAL 0.90, OFF 1.00; all restore exactly |
| Quality presets | low = standard material, no environment; medium = physical, clearcoat 0.6, environment 0.55; high/ultra/auto = physical, clearcoat 1, environment 0.85; hover works in all 5 |
| Mobile 390×844 + touch | a real CDP touch tap selects Income; no hover class, no dimming (Debt stays at rest luminance) |
| Hidden-node edges (4E) | the overview shows only the core→domain edges; `SpatialEdges.jsx` is unchanged |
| Console / page errors | none from the app. One informational ANGLE warning (`X4122 … double precision`) from compiling the physical-material shader: harmless. Plus the known `THREE.Clock` deprecation |

A correction made during acceptance: the first spotlight version dimmed only
colour and emissive. The measurements passed, but screenshots showed the
other balls barely darker, because clearcoat and environment reflections
stayed bright. Dimmed tiers now also cap opacity (0.55), and the hovered
glow was raised. The re-run passed, and the screenshots show clear dimming.

Screenshots with real financial data were kept local, not committed.

The owner's session ended partway through the regression run, and a
25-minute wait for a new sign-in timed out. The remaining Layer 3 matrix was
therefore run with the harness below, against the same modified runtime.

## Browser: Layer 3 harness (signed-out demo scene, same runtime)

`npm run validate:layer3`, fresh run 2026-09-26T14:12Z. Every check is true:
- initialization, hover, selection, deselection, switching, rapid
  interruption, keyboard, camera focus/reset;
- FULL / REDUCED / MINIMAL / OFF;
- desktop 1920×1080, laptop 1366×768, tablet 768×1024, mobile 390×844;
- console, WebGL fallback.

This also covers the Layer 2C runtime behaviours. Demo-scene screenshots
(no personal data) are in `screenshots/chapter-7/`.
