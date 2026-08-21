# V1 to V2 migration

## Baseline state

- Repository baseline commit: `4ffa43d`
- V1 working branch at inspection: `feature/real-money-ai`
- V2 branch: `develop/v2`
- The inspected working tree contained substantial uncommitted V1 work. It was preserved without reset, stash, overwrite, or inclusion in the V2 foundation commit.
- No `v1.0.0` tag existed. The older commit was not labeled as validated because it does not include the current uncommitted V1 state.

## Preserved systems

Hash-based navigation, Firebase initialization, Firebase Authentication, per-user Firestore collections, financial hooks/calculations, existing dashboards, Money AI, app lock, PWA configuration, and Cloud Functions remain structurally unchanged by this layer.

## Architecture introduced now

Central feature flags, renderer-neutral spatial contracts, a financial-to-visualization adapter contract, rendering capability hints, global motion policy, V2 design tokens, chapter traceability, and ADRs.

## Preserve / Refactor / Replace

| System | V1 status | V2 decision | Action now | Future action |
| --- | --- | --- | --- | --- |
| Authentication | Working Firebase Auth | Preserve | None | Harden only per approved requirements |
| Financial logic | Working hooks and page calculations | Preserve | Define isolation rule | Extract by domain when required |
| UI | Working React/Vite UI | Replace progressively | Tokens and boundaries only | Migrate behind flags |
| Firebase | Working client and per-user collections | Preserve | No schema change | Extend only per chapters |
| Routing | Working hash navigation | Preserve | None | Reassess with application-shell layer |
| 3D engine | Absent | Add | Contracts only | Select and implement later |
| Motion system | CSS/browser behavior | Extend | Policy and tokens | Add orchestration later |
| Money AI | Existing client/service/functions | Audit later | No rewrite | Isolate behind V2 intelligence boundary |
| PWA | Configured through Vite plugin | Preserve | None | Validate V2 offline behavior later |

## Migration rules

1. Default all V2 flags off until the capability has its own validation evidence.
2. Keep persistence, financial models, adapters, and renderers separate.
3. Do not change Firebase schemas or financial calculations as a side effect of visual work.
4. Maintain accessible, non-spatial access to critical information.
5. Record chapter implementation paths and validation outcomes in the registry.

## Known future refactors

`src/App.jsx` currently owns routing, orchestration, and several calculations. It should be decomposed incrementally after regression coverage exists. Existing financial hooks should become explicit domain/application services only when their corresponding V2 layer is implemented.

## Rollback

V2 runtime behavior can be disabled by leaving `VITE_V2_ENABLED` unset or false. The foundation commit can be reverted independently. A trustworthy V1 release tag should be created only after the pre-existing working changes are reviewed, validated, and committed by their owner.
