# Spatial runtime boundaries

- `core`: Canvas lifecycle, renderer configuration, context loss, and public runtime composition.
- `scene`: domain-agnostic world composition and coordinate scale.

Semantic motion and interaction ownership lives in `src/motion`; runtime components consume coordinated targets and translate no raw input directly into animation timelines.
- `camera`: the single product-controlled camera rig and pure camera-state calculations.
- `lighting`: restrained quality-aware illumination.
- `nodes`: reusable node geometry, materials, labels, and visual state.
- `edges`: explicit validated relationships; no topology or force layout.
- `interaction`: centralized hover, selection, focus, and reset state.
- `quality`: pure auto/low/medium/high/ultra policy and DPR limits.

Runtime modules may import spatial contracts and normalized visualization models. They must not import Firebase, authentication, Cloud Functions, repositories, or financial calculation logic. External application code should enter through `runtime/index.js` rather than deep runtime imports.
