# Spatial runtime architecture

## Runtime boundaries

| Subsystem | Ownership |
| --- | --- |
| `core` | Canvas lifecycle, renderer settings, context events, runtime shell |
| `scene` | Domain-agnostic world composition, scale, background, fog |
| `camera` | Single perspective camera, target, focus, reset, responsive distance |
| `lighting` | Restrained ambient, key, and optional rim lighting |
| `nodes` | Shared geometry, native materials, labels, hover and selection visuals |
| `edges` | Explicit source/target validation and state-aware lines |
| `interaction` | Central hover, select/deselect, focus, and reset state |
| `quality` | Auto/low/medium/high/ultra presets, DPR, detail, and light policy |

The public runtime API is `src/spatial/runtime/index.js`. Three.js and React Three Fiber remain below the existing lazy `SpatialExperience` boundary.

## Data flow

```text
financial data
  -> financial domain/services
  -> visualization adapter
  -> normalized spatial model
  -> spatial runtime
```

Layer 2 uses static domain names through `createProofSpatialScene`. Rendering code does not query Firebase, use authentication, invoke Cloud Functions, or calculate financial metrics.

## Coordinates and scale

- X is horizontal, Y is vertical, and Z is depth.
- `[0, 0, 0]` is the Money Mind Financial Core.
- One world unit is the base node-scale unit.
- Proof domains use a deterministic XY radial layout at 3.15 world units.
- The desktop overview camera is `[0, 0, 7.4]`; narrow viewports use `[0, 0, 9.4]`.
- Scene scale reduces at 900 px and 560 px to maintain radial framing.

## Camera model

`CameraRig` is the sole camera controller. Selecting a node creates a deterministic target and closer camera goal. Full and reduced motion use frame-rate-independent interpolation; minimal and off modes apply near-instant or immediate state. Overview/reset returns the target to the origin. There are no free-form orbit controls.

## Quality system

| Preset | Maximum DPR | Geometry | Antialiasing | Lighting |
| --- | ---: | --- | --- | --- |
| low | 1.0 | low | off | basic |
| medium | 1.25 | normal | on | standard |
| high | 1.5 | normal | on | enhanced |
| ultra | 2.0 | high | on | enhanced |
| auto | conservative capability choice | derived | derived | derived |

Auto selects low for mobile-class or low-memory hints, high only for strong explicit memory/processor hints, and medium otherwise. It is a policy, not a hardware benchmark.

## Runtime and recovery

The renderer uses a bounded DPR, explicit perspective camera, opaque near-black background, sRGB output, capped far plane, and quality-dependent antialiasing/power preference. A continuous frame loop currently supports camera and node interpolation. A future motion scheduler may switch idle scenes to demand rendering.

WebGL capability is checked before the lazy runtime mounts. Initialization errors are contained by the application-level spatial error boundary. Context loss is detected, default loss behavior is paused, and a recovery notice remains until the browser restores the context.

## Accessibility

Every proof node has a keyboard-focusable HTML button synchronized with centralized selection. The shell exposes overview/reset and quality controls. Reduced-motion preference shortens camera/node interpolation, while minimal/off policies support immediate movement. Unsupported WebGL and invalid/missing models render an HTML fallback, and critical financial information remains in V1 views.

## Deferred systems

Advanced cinematic choreography, orbit/fly-in sequencing, post-processing/bloom, custom shaders, particles, graph discovery/layout, simulation, timelines, real financial mapping, and production navigation remain intentionally deferred.
