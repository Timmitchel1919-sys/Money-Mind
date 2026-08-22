# Motion and interaction engine

## Scope

Layer 3 centralizes choreography for the lazy V2 spatial runtime. It does not replace ordinary application CSS motion, introduce graph topology, or connect real financial data. The normalized spatial model remains renderer-neutral.

## Dependency decision

GSAP is deferred. Native R3F interpolation is sufficient because Layer 3 animates coordinated target states rather than an open-ended authored timeline.

| Requirement | Native R3F | GSAP | Decision |
| --- | --- | --- | --- |
| Hover interpolation | Strong | Strong | Native |
| Camera focus/retarget | Strong | Strong | Native |
| Multi-node entry stagger | Simple with shared progress | Strong | Native |
| Coordinated edge reveal | Simple with shared progress | Strong | Native |
| Reversible target transition | Natural retargeting | Strong | Native |
| Interruptible selection | Natural retargeting | Strong | Native |
| Semantic scene choreography | Provider/state model required either way | Strong | Native |

Adding GSAP would add bundle and lifecycle cost while React semantic state plus R3F ref interpolation already provides deterministic cancellation and retargeting. It may be reconsidered when later layers require authored multi-track timelines that cannot be expressed cleanly as target-state transitions.

## Structure

```text
src/motion/
├── accessibility/motionPolicies.js
├── camera/cameraMotion.js
├── core/MotionProvider.jsx
├── core/motionContext.js
├── core/motionState.js
├── edges/edgeMotion.js
├── input/motionIntents.js
├── nodes/nodeMotion.js
├── orchestration/transitionSequences.js
├── performance/animationBudget.js
├── radial/RadialMotionGroup.jsx
├── radial/radialMotion.js
├── transitions/motionTokens.js
└── config.js
```

## Semantic scene state

Stable states are `overview` and `focused`. Transitional states are `hovering`, `selecting`, `switching`, and `resetting`.

Valid primary transitions:

```text
overview → hovering → overview
overview → selecting → focused
focused → switching → focused
focused → resetting → overview
selecting/switching → switching → focused
selecting/switching → resetting → overview
```

The provider owns current state, selected node, hovered node, active transition, target node, duration, start time, and a ref-based progress reader. Components do not infer independent scene phases.

## Orchestration and cancellation

`MotionProvider` translates semantic intents into transition sequences. Starting a sequence clears the previous settlement timer, updates selection and phase atomically, assigns a new transition identity, and retargets every renderer subsystem. A stale timer can never settle a newer transition because settlement verifies the transition identity.

Interruption does not remount Canvas or accumulate timelines. Continuous values damp from their current values toward new targets, so switching and reversal are restartable from any in-flight frame.

## Input architecture

Pointer meshes, DOM labels, keyboard activation, toolbar reset, and empty-Canvas reset emit the same intents:

- `HOVER_NODE`
- `CLEAR_HOVER`
- `SELECT_NODE`
- `RESET_VIEW`

No input component owns camera, node, or edge animation logic. Tap remains compatible with the click/select intent; future gesture adapters can emit the same actions.

## Motion policies

- **Full:** 720 ms restrained entry, smooth camera travel, radial stagger, full emphasis and coordinated edge/node transitions.
- **Reduced:** shorter durations, 44% camera travel, smaller scale contrast, limited stagger.
- **Minimal:** 80 ms transitions, 18% camera travel, no decorative stagger, restrained scale change.
- **Off:** zero-duration semantic settlement and immediate renderer targets; all interactions remain functional.

Tokens for durations, easings, and stagger live in `transitions/motionTokens.js`. Policy-specific damping and travel live in `accessibility/motionPolicies.js`.

## Camera motion

The accepted camera target calculator remains the source of overview/focus positions. The motion camera layer blends overview and focused targets by policy travel, and `CameraRig` performs ref-based damping. Selection, switching, reset, and interruption therefore share one retargetable camera path without orbit controls.

## Node motion

`resolveNodeMotion()` produces generic targets for entry, hover, selected, contextual core, muted secondary, restoration, and radial position scale. Nodes interpolate mesh transforms and material values in `useFrame`; React does not update every frame.

Entry uses the active transition's shared progress and deterministic radial order. In focus, the selected radial node gains scale, opacity, and emissive priority; the core remains visible but contextual; unrelated nodes remain present at reduced opacity.

## Edge motion

Edges resolve default, hover-active, selected-connected, muted, entry-reveal, and restoration targets. Material opacity and color interpolate in `useFrame`. No particle flow or financial-flow animation is included.

## Radial motion

The radial layer owns reusable radius and rotation targets. Entry expands nodes from a contracted radius, focus contracts context slightly, reset restores it, and switching applies a subtle coordinated rotation that settles back. The contract supports later radius expansion, contraction, rotation, and position retargeting without a graph engine.

## Performance and cleanup

- Semantic React updates occur only on intent, phase change, and settlement.
- Camera, mesh, radial group, and material interpolation use refs in `useFrame`.
- Settlement timers are cancelled on interruption and unmount.
- Geometry disposal and WebGL context listeners retain their existing cleanup.
- Canvas remains `frameloop="always"` in Layer 3. Demand rendering is deferred because changing the proven renderer lifecycle solely for this layer would add risk; the engine is structured so active-transition invalidation can be added later.
- The spatial runtime remains lazy-loaded. No motion package was added to the initial application dependency graph.

## Deferred work

Graph topology, real nested financial nodes, gestures, particle flow, post-processing, authored timeline tooling, and demand-frame rendering remain intentionally deferred.
