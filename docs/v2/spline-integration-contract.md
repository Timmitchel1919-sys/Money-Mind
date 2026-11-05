# Spline integration contract (draft)

Status: design contract; the Spline scene is not yet integrated or released.

## Authority

`MODULE_REGISTRY` is the source of module and workspace identities. The V2
`MotionProvider` owns selected and hovered nodes, transition state and camera
intents. `ModuleContextPanel` resolves available workspaces and delegates to the
existing application router. Financial hooks and adapters remain the sole source
of financial data; the scene must not query or write Firestore.

## Scene object mapping

The current Spline file is `Money Mind Spatial Universe` (file UUID
`9d8ec850-c143-447e-a30d-ac169ecdf506`). These names and IDs were read from
the scene on 2026-11-05. Treat them as an asset-version contract and verify
them again after exporting; do not use display text to derive routes.

| Spline object | Spline object ID | Money Mind node |
| --- | --- | --- |
| MM_CORE | 6ebd998f-74fe-42a9-8e7b-f6e19cae3206 | money-mind-core |
| MM_MAIN_DASHBOARD | fcf26801-d51b-44f8-ac15-070fe8e24783 | dashboard |
| MM_MAIN_MONEY MOVEMENT | 66f98909-e353-4ff4-9146-39f404f18082 | money-movement |
| MM_MAIN_WEALTH BUILDING | 0a7127e5-715f-490d-9e09-ad67dfe17e85 | wealth-building |
| MM_MAIN_INTELLIGENCE | 50c333f6-a160-42d6-beff-ebbf37fd5ff5 | intelligence |
| MM_MAIN_SETTINGS | d0b57af6-fb3a-44c7-9989-f1bdfccbef84 | settings |

## Intended event flow

The renderer reports a selected object ID to a narrow adapter. The adapter
accepts only mapped IDs present in the current visible registry and dispatches
the existing `openModuleIntent` or `returnToCoreIntent`. React's existing
navigation panel handles submodule selection and workspace routing. Selection
and hover flow back from `MotionProvider` to the renderer as visual state;
the renderer does not own navigation. DOM controls remain the keyboard and
non-WebGL path. Listeners and renderer resources must be disposed on unmount.

Scene loading, unknown or missing objects, and WebGL failure must fail closed
to the existing spatial renderer or Classic view, never to fabricated data.
The scene's independent HTML overlay must not ship as a navigation surface.
Sensitive records are supplied only to React from existing authorized data
adapters, not embedded in the scene or its public export.

## Release gates

Obtain and verify an integration-ready scene export, then test object ID
stability, pointer and keyboard selection, URL/history synchronization, cleanup,
reduced motion, mobile layout and WebGL fallback. Verify real-data loading,
empty and error states before adding a result rail. Keep V2 flags off by default.
The current scene has no verified runtime export, readable native labels,
connections or selection events and must not be treated as production-ready.
