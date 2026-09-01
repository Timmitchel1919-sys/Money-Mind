# Spatial dependency decisions

## Current package architecture

Money Mind uses npm with `package-lock.json` as the authoritative root lockfile. Firebase Functions is a nested npm package with its own `functions/package-lock.json`. No pnpm, Yarn, or Bun lockfile is present.

Before Layer 2, the relevant stack was React 19.2.7, React DOM 19.2.7, Vite 8.1.3 installed from a `^8.1.1` range, Tailwind CSS 4.3.2, Recharts 3.9.2, and CSS-based transitions/animations. The repository had no WebGL renderer, React 3D binding, graph engine, JavaScript motion engine, or post-processing runtime.

## Decision matrix

| Capability | Existing solution | Candidate | Needed now | Decision |
| --- | --- | --- | --- | --- |
| 3D renderer | None | `three` | Yes | Added |
| React WebGL binding | None | `@react-three/fiber` | Yes | Added |
| 3D helpers | None | `@react-three/drei` | No | Deferred until a concrete helper is used |
| Bloom/post-processing | None | `@react-three/postprocessing` | No | Deferred to visual-effects work |
| UI motion | CSS and V2 motion policy | GSAP / Motion | No | Use existing foundation |
| Charts | Recharts | D3/ECharts | No | Keep Recharts |
| Financial graph topology | None | Graphology/Sigma/Cytoscape | No | Deferred to Financial Graph Engine |
| Physics/particles/shaders | None | Rapier and effect libraries | No | Deferred |

## Packages added

### `three` 0.185.1

The core, maintained WebGL rendering engine. Layer 2 uses it through React Three Fiber for scene, mesh, material, camera, light, and transform capabilities.

### `@react-three/fiber` 9.7.0

The maintained React renderer for Three.js. Its peer range supports React and React DOM `>=19 <19.3` and Three.js `>=0.156`, matching this repository's React 19.2.7 and Three.js 0.185.1.

## Lazy-load boundary

`SpatialExperience.jsx` is the lightweight capability and feature-flag gate. Only after `v2SpatialUI` is enabled and WebGL is detected does React load `runtime/SpatialRuntime.jsx`. All imports of React Three Fiber and the spatial scene remain below that dynamic boundary so normal V1 routes do not download the 3D runtime.

The boundary respects the existing reduced-motion capability, selects a conservative mobile quality, and provides both unsupported-WebGL and initialization fallbacks. Critical financial information remains available through the normal dashboard.

## Existing extraneous installation state

`@tanstack-query-firebase/react`, `@tanstack/react-query`, and `@tanstack/query-core` were present in `node_modules` but absent from both the manifest and lockfile, and no source imports referenced them. Standard npm installation pruned these local extraneous directories. No declared dependency was removed.

## Deferred packages

- `@react-three/drei`: reconsider when a scene immediately needs a maintained helper such as an HTML overlay or loader.
- `@react-three/postprocessing` and `postprocessing`: reconsider when an approved proof requires bloom or tone-mapped effects.
- GSAP, Motion, and React Spring: reconsider in the Motion & Interaction layer only if CSS, frame updates, and the V2 motion policy are insufficient.
- Graphology, Sigma, Cytoscape, and force-graph packages: reconsider in the Financial Graph Engine layer.
- Physics, particle, shader, procedural-noise, and tuning packages: defer until a measured requirement exists.
