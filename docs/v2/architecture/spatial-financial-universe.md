# Chapter 7: Spatial Financial Universe (visual and hover layer)

- Status: implemented and validated. Part of the flag-gated V2 spatial view
  (`VITE_V2_SPATIAL_UI`); production keeps V2 off.
- Registry: chapter 7. The owner's brief called it "Layer 5". In this
  repository, chapter/layer 5 is the already-accepted Graph Drill-down, so the
  work was registered as the next free chapter instead of renumbering
  anything.
- Tests: `npm run test:spatial-universe`
- Validation: `docs/v2/validation/chapter-7-spatial-financial-universe.md`

## What changed (and what did not)

Only presentation and interaction inside the existing systems:

| Concern | Owner | Change |
| --- | --- | --- |
| Semantic source | Financial graph / KPI model | none |
| Scene structure (core → domains → children, reveal rules, edge reveal from 4E) | Layer 2 / 4D | none |
| Node visual targets | Layer 3 `resolveNodeMotion` (`src/motion/nodes/nodeMotion.js`) | adds the hover spotlight tiers and a `brightness` target |
| Damping / motion policy | Layer 3 policies | reused as is (`nodeDamping`; OFF = instant) |
| Materials and palette | `src/spatial/runtime/nodes/nodeMaterials.js` | brighter palette, quality-tiered PBR materials |
| Applying targets per frame | `SpatialNode.jsx` | damps `brightness` and scales a preallocated base `Color` |
| Lighting | `src/spatial/runtime/lighting/SpatialLighting.jsx` | stronger key/rim lights plus a prefiltered `RoomEnvironment` for reflections |
| Hover input | `SpatialNode.jsx`, `NodeLabels.jsx` | no hover from touch; label focus previews only on `:focus-visible` |

No new dependencies. `RoomEnvironment` and `PMREMGenerator` ship inside the
existing `three` package. There is no post-processing, bloom, shader or
particle library, and no new animation loop or state.

## Glossy material strategy

`nodeMaterialTier(lightingMode)` follows the quality preset's existing
`lighting` value:

| Quality | Lighting mode | Material | Clearcoat | Environment reflections |
| --- | --- | --- | --- | --- |
| low | basic | `MeshStandardMaterial` (metalness 0.2, roughness 0.38) | — | off |
| medium | standard | `MeshPhysicalMaterial` (0.18 / 0.26) | 0.6 | 0.55 |
| high / ultra | enhanced | `MeshPhysicalMaterial` (0.16 / 0.2) | 1.0 (roughness 0.06) | 0.85 |

The environment is used only for PBR reflections (`scene.environment`); the
scene background colour is unchanged. It is created once per lighting mode
and disposed on change or unmount.

## Color strategy

A dark premium scene with bright, saturated nodes. Each tone keeps its
meaning, and the hues are spread around the colour wheel:

| Tone (domain) | Base |
| --- | --- |
| core (Money Mind) | violet `#6f52ff` (brand) |
| positive (income) | teal `#12c29d` |
| growth (investments) | blue `#3f86ff` |
| stable (assets) | gold `#e6b43c` |
| liability (debt) | rose `#ee4f86` |
| outflow (expenses) | coral `#ff7a45` |
| reserve (savings) | green `#3ccf6e` |

Tests confirm each base colour is at least 3× the old luminance, at least 60%
saturated, and at least 12° of hue from every other tone. Labels are DOM
overlays and are unaffected.

## Hover spotlight and dimming

`resolveNodeMotion` picks one tier per node. The priority is deterministic,
highest first:

| Tier | Emissive | Brightness × base | Opacity cap |
| --- | --- | --- | --- |
| hovered node | 1.9 | 1.45 | 1 |
| selected node (no other hover) | 1.08 | 1.12 | 1 |
| selected node while another is hovered | 0.82 | 0.95 | 0.85 |
| core at rest (with a selection: 0.5) | 0.62 | 1 | 1 |
| core while another node is hovered | 0.3 | 0.62 | 0.7 |
| other node at rest | 0.42 | 1 | 1 |
| other node while another is hovered (**dimmed**) | 0.1 | 0.4 | 0.55 |

- **Dimmed nodes darken but stay visible.** Brightness never drops below 0.4
  and opacity never below 0.55. On the dark scene, the opacity cap also
  darkens clearcoat and specular reflections, which a colour multiplier alone
  can't do (measured and corrected during acceptance).
- **Selection vs hover.** Hover is transient emphasis; selection stays the
  Layer 3 `selectNode` state and is never changed by hover. Hovering the
  selected node uses the hover tier. While another node is hovered, the
  selection keeps its scale emphasis and stays above dimmed nodes. A node that
  selection had muted (opacity 0.3) is lifted to 0.75 while hovered.
- **Core hierarchy.** The core is the largest node and the strongest at rest.
  It never outshines a hovered node, but stays above dimmed nodes.
- **Children.** Hidden children stay hidden. A revealed child gets the same
  tiers as any other node.
- **Hover exit.** Targets return to the rest tier, so the scene restores
  exactly.

## Motion policy

All three targets (brightness, emissive, opacity) are damped with the active
policy's `nodeDamping` in the existing `useFrame` of `SpatialNode`. Measured
spotlight progress 60 ms after hover: FULL ≈ 45%, REDUCED ≈ 60%, MINIMAL ≈ 88%,
OFF = 100% (instant). Scene states stay the Layer 3 ones
(`overview` ↔ `hovering`).

## Accessibility

- Keyboard focus (`:focus-visible`) on a node label previews the spotlight;
  Enter or Space selects (unchanged).
- State is never conveyed by lighting alone: labels keep `aria-pressed`,
  `is-hovered`, `is-active` and `is-muted`.
- In OFF motion (no scale travel by Layer 3 design), selection is identified
  by its tier and by `aria-pressed`.

## Touch

Touch has no real hover. A tap previously fired hover through emulated mouse
and focus events, and with dimming that would have left every other node dark.
Now:
- `SpatialNode` ignores `pointerType === "touch"` for hover;
- labels use pointer events that ignore touch, and preview on focus only when
  it's `:focus-visible`.

A tap selects (verified with a real CDP touch event).

## Performance

- No React state per frame. Brightness lives in a ref.
- The base `Color` is allocated once per palette and copied and scaled in place.
- A hover changes only the motion engine's existing `hoveredId`.
- The graph is not rebuilt on hover (Layer 4E measurements still apply).
- The environment map is built once per lighting mode.
- Main bundle unchanged; the runtime chunk carries the small `RoomEnvironment`
  module.
