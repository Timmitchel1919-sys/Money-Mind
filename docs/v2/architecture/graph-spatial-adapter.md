# Layer 4D: Financial Graph → Spatial Adapter

- Status: implemented and validated. Live in the signed-in `#spatial` view
  only behind the off-by-default `VITE_V2_GRAPH_BUILDER` flag, fed by the
  Financial Graph Builder (`financial-graph-builder.md`).
- Location: `src/visualization/adapters/financialGraphSpatialAdapter.js`
- Tests: `npm run test:financial-graph-spatial-adapter`
  (`scripts/v2/validate-financial-graph-spatial-adapter.mjs`)
- Depends on: Layer 4A/4B (`src/financial/graph/`), the existing spatial scene
  contract (`src/spatial/contracts.js`), and the existing radial layout
  (`financialSpatialAdapter.js`, `src/visualization/radial/`).

## Data flow

```
Firebase / repositories -> hooks (useFinancialKPIs, ...)      (unchanged)
        -> FinancialGraph (Layer 4A)       [Financial Graph Builder]
        -> Graph Engine (4B) / Transformations (4C: views, pipelines)
        -> createFinancialGraphSpatialScene (4D)   <- presentation (formatted strings, sizes)
        -> SpatialScene -> Layer 2 runtime -> Layer 3 motion engine
```

The adapter is the only module that knows about both a `FinancialGraph` and a
`SpatialScene`. The dependency points one way: `src/visualization/` imports
`src/financial/graph/`, never the reverse.

## API

```js
const { scene, selection, coverage } = createFinancialGraphSpatialScene(graphOrEngine, {
  presentation,      // { [spatialNodeId]: { detail?: string, magnitude?: (0,1] } }
  selection,         // Layer 4B GraphSelection { nodeId } | null
  projected,         // passthrough, like financialSpatialAdapter
  monthsForward,     // passthrough
})
financialGraphSpatialAdapter.toScene(graphOrEngine, options) // FinancialVisualizationAdapter shape
```

Everything returned is frozen.

## Node mapping

| Graph | Spatial node |
| --- | --- |
| The (at most one) node of type `"core"` | `kind: "core"` at the origin, id = graph node id |
| Each declared top-level graph domain that has a canonical spatial slot | `kind: "radial"`, id = domain id, label = the graph domain's label, tone and position from the existing slot |
| Every other node in a mapped domain (sub-domains resolve to their top-level ancestor) | `kind: "child"`, `parentId` = top-level domain id, ringed around it with the existing child-ring geometry, in graph order |

Semantic metadata carried through: `entityId` (graph node id),
`financialDomain`, `graphType`, `status`. Spatial `domain` is always the
existing `SpatialDomain` value `"financial"`.

## Edge mapping

- Every graph edge whose two endpoints are both in the scene becomes a
  `SpatialEdge` with the **same id, direction, relationship and status**.
- Structural edges give the scene the same core → domain → item shape the
  runtime already renders and reveals: `financial-domain` (core → each radial
  domain, only when a core exists) and `domain-item` (domain → each child).
  Their ids contain `--`, which can never occur in a Layer 4A identifier, so
  they cannot collide with graph edge ids.

## Domain mapping

The canonical spatial domains are **not redefined**. `financialSpatialAdapter.js`
now exports its existing `DOMAIN_ORDER` as `FINANCIAL_SPATIAL_DOMAINS`, plus
`financialDomainSlotPositions()` and `childRingPositions()`. Both adapters use
these, and the refactor was verified byte-identical on existing scene output.
A domain always lands in the same slot the live scene uses, whatever subset a
view contains.

**Domains with no spatial slot** (e.g. a graph-declared `goals` or
`net-worth`) are not fabricated. Their nodes are omitted, edges touching them
are omitted (never dangling), and all of it is reported in
`coverage.{unmappedDomains, omittedNodeIds, omittedEdgeIds}`. The core node is
exempt: it maps to the centre whatever its domain.

## Selection mapping

A Layer 4B `GraphSelection` (`{ nodeId }`) maps to a `SpatialSelection`
(`{ nodeId, edgeId: null }`). A selected node that was omitted maps to
`nodeId: null` (no dangling selection). A node id that isn't in the graph is
rejected. The adapter dispatches nothing: a caller hands `selection.nodeId`
to the existing motion engine (`selectNodeIntent`). There's no second
interaction state machine and no MotionProvider state duplication.

## Boundaries

- **Financial values:** the adapter reads no amounts and calls no
  calculation. `detail` must be a pre-formatted string and `magnitude` a number
  in (0, 1]; both come from the caller, as with the existing adapter's
  `detail`. Scene nodes carry no `amount` field (enforced by test).
- **Layout:** existing radial slots and child rings only. No force layout,
  physics, randomness or graph library (source-scanned by test).
- **Camera / motion / rendering:** untouched. No Three.js, R3F or React
  imports; Layer 2/3 code is unchanged.
- **Firestore:** no access. Input is a `FinancialGraph` value.

## Rejection (safe failure)

`GraphSpatialAdapterError` with a `code`:
- `INVALID_GRAPH`: fails Layer 4A validation, via the Layer 4B engine.
- `INVALID_DOMAIN_HIERARCHY`: a cyclic domain parent chain.
- `AMBIGUOUS_CORE`: more than one `"core"` node.
- `IDENTITY_CONFLICT`: a graph node reuses a domain's spatial id.
- `INVALID_PRESENTATION`: malformed `detail`/`magnitude`.
- `INVALID_SELECTION`: the selected node isn't in the graph.

## Known limitations

- Wired only behind `VITE_V2_GRAPH_BUILDER`. With the flag off, the live
  scene still comes from `createFinancialSpatialScene(model)`.
- **Semantic edges between child nodes.** The runtime reveal rule
  (`SpatialEdges.jsx`) hides only `domain-item` edges while a domain is
  collapsed. A semantic child ↔ child edge would stay visible while its
  endpoints are collapsed; this was observed in the browser for the builder's
  asset → core `increases` edge. The adapter produces a valid scene either way.
  Deciding how such edges reveal is Layer 2/3 work, left for when the graph
  is wired in.
- Only the six canonical domains have spatial slots; other domains are
  reported, not shown.
