# Financial Graph Engine — Layer 4A/4B/4C: contracts, engine, transformations

- Status: Contracts (Layer 4A) + a read-only deterministic query/traversal
  engine (Layer 4B) + deterministic, non-mutating graph transformations
  (Layer 4C, including relationship views and pipeline composition). The
  Layer 4D graph → spatial adapter is documented separately in
  `graph-spatial-adapter.md`. No graph library; not wired into the live UI.
- Location: `src/financial/graph/`
- Depends on: nothing V2-specific. Independent of `src/spatial/`, `src/motion/`,
  and the existing `v2GraphEngine` flag/UI (see "Relationship to the existing
  `v2GraphEngine` flag" below).

## Purpose

Money Mind's spatial view currently renders a fixed, six-domain radial layout
(`src/visualization/adapters/financialSpatialAdapter.js`): one core node, one
node per hardcoded domain, and — behind the `v2GraphEngine` flag — one ring of
child nodes per domain (`src/hooks/useFinancialBreakdown.js`). That shape is
useful but closed: it cannot express an edge between two domains, a node that
isn't a domain or a domain's direct child, or a relationship other than
"is a line item of."

Layer 4A defines a **canonical, general-purpose financial graph contract** —
plain, serializable nodes/edges/domains with deterministic identity and
explicit validation — that a *future* adapter layer could use to describe
richer financial structure (e.g. "this savings goal is funded by that income
category," "this debt payment reduces that liability") without inventing a
new ad hoc shape each time. It does not replace
`financialSpatialAdapter.js` or the `v2GraphEngine` drill-down UI today; it is
the foundation a later layer can build on.

## Financial / spatial boundary

```
Financial Graph                 (src/financial/graph/ — this layer)
        ↓
Graph-to-Visualization Adapter   (not built in Layer 4A)
        ↓
Spatial Visualization Model      (src/spatial/contracts.js — SpatialScene/Node/Edge, existing)
        ↓
Spatial Runtime                  (src/spatial/runtime/ — existing, untouched)
```

Per ADR-0002 (financial domain isolation) and ADR-0003 (spatial rendering
isolation): `src/financial/graph/` contains plain data and pure functions
only. It never imports Three.js, React, DOM APIs, or anything from
`src/spatial/runtime/` or `src/motion/`, and it never queries Firebase or
Firestore directly. Conversely, the existing `SpatialScene`/`SpatialNode`/
`SpatialEdge` contracts in `src/spatial/contracts.js` are unchanged — they
remain the renderer-neutral model the spatial runtime actually consumes.

## Existing models reused, not duplicated

Before defining new contracts, the existing financial/visualization surface
was inspected. Domain identifiers were **reused as-is**, not redefined:

- `income`, `expenses`, `assets`, `debt`, `savings`, `investments` — the same
  six ids keyed in `useFinancialKPIs`, `useFinancialBreakdown`, and
  `financialSpatialAdapter`'s `DOMAIN_ORDER`.
- `src/financial/graph/domains/knownFinancialDomains.js` exports these six as
  ready-made `GraphDomain` objects so a future adapter shares identity with
  the existing spatial layer instead of needing a translation table.

No parallel "Account", "Transaction", or "Asset" entity model was created —
those already exist as Firestore-backed hooks (`useAssets`, `useDebt`,
`useTransactions`, etc.) and stay exactly where they are. The graph contract
describes *structure* (which financial facts relate to which, and how); it
is not a replacement persistence or calculation layer.

## Relationship to the existing `v2GraphEngine` flag

`VITE_V2_GRAPH_ENGINE` / `featureFlags.v2GraphEngine` already exists and
already gates something: the one-level domain → child-line-item fan-out
shipped in the (already-accepted) "Graph Drill-down" chapter
(`docs/v2/validation/layer-5-graph-drilldown.md`, chapter 5 in
`docs/v2/chapter-registry.yaml`). That feature is unchanged by Layer 4A —
this document uses "Layer 4A" only as this specification's own step number,
not as a chapter-registry entry (chapter 4 is already "Financial Data in
Spatial Nodes"; see ADR-0005 — chapters are assigned to approved
specifications, not invented ahead of one). Reconciling the numbering (e.g.
registering this work as a new chapter once an adapter exists) is future
work, not part of Layer 4A.

## Graph model

```js
FinancialGraph = {
  id: string,            // deterministic, caller-supplied
  version: string,       // content/schema version — NOT identity
  domains: GraphDomain[],
  nodes: GraphNode[],
  edges: GraphEdge[],
  metadata?: object,     // e.g. { generatedAt } — observational only
}
```

A graph is self-contained: every node's `domain` must resolve to a domain
declared in that same graph's `domains` array (not an external global
registry), so a graph is safe to serialize, hand to another process, or
diff on its own.

## Node model

```js
GraphNode = {
  id: string,       // deterministic — see Identity
  type: string,     // entity type, e.g. "core", "category", "goal", "account"
  domain: string,   // a GraphDomain id declared on the same graph
  label: string,
  status: string,   // e.g. "active" | "inactive" | "projected" | "archived"
  metadata?: object,
}
```

`type` is open-ended by design (`validateGraph(graph, { nodeTypes })` can
enforce a closed vocabulary per call-site if a producer wants one; the
contract itself does not hardcode a final list — the specification
explicitly calls out `income`, `expenses`, `assets`, `debt`, `savings`,
`investments`, `netWorth`, `goals`, and `cashFlow` as *potential* domains,
not a closed set, and the same openness applies to node types).

## Edge model

```js
GraphEdge = {
  id: string,            // deterministic — see Identity
  source: string,        // a GraphNode id
  target: string,        // a GraphNode id
  relationship: string,  // semantic identifier, e.g. "funds", "contributes_to"
  status: string,
  metadata?: object,
}
```

`src/financial/graph/relationships/knownRelationships.js` exports a starter
vocabulary (`funds`, `contributes_to`, `belongs_to`, `reduces`, `increases`,
`owes`, `pays`, `supports`, `depends_on`) taken directly from the
specification. It is a reference list, not an enforced enum — pass it to
`validateGraph(graph, { relationships: KNOWN_RELATIONSHIPS })` where a
producer wants strictness; otherwise any well-formed identifier is accepted.

Self-referencing edges (`source === target`) are always rejected — Layer 4A
has no use case for them, so they are treated as a data error rather than a
supported (if unusual) relationship. Revisit if a future relationship
legitimately needs one.

## Domain model

```js
GraphDomain = {
  id: string,
  label: string,
  description?: string,
  parentId?: string | null,  // another domain id, for hierarchy
  metadata?: object,
}
```

Domains carry no rendering information (no color, tone, position, or camera
data — that stays entirely inside `financialSpatialAdapter.js` and the
spatial contracts, where it already lives today).

## Identity

All IDs are deterministic and caller-derived — never random, never
timestamp-based:

- **Domain id**: a caller-supplied stable slug, e.g. `"income"`. Reuse the
  existing project convention (the six ids above) wherever the same concept
  is meant.
- **Node id**: `createNodeId(domain, type, key)` → `"${domain}-${type}-${key}"`,
  e.g. `createNodeId("income", "category", "salary")` →
  `"income-category-salary"`. Mirrors the hyphen-joined convention already
  used by `financialSpatialAdapter.js` (`` `${domain.id}-item-${index}` ``,
  `` `core-${domain.id}` ``) — never an array index.
- **Edge id**: `createEdgeId(source, relationship, target)` →
  `"${source}-${relationship}-${target}"`.
- **Graph id**: a caller-supplied stable slug, e.g.
  `"money-mind-financial-graph"`.
- **Version vs. timestamp**: `graph.version` is a caller-supplied content
  version and is never used as identity. An observational timestamp (e.g.
  `metadata.generatedAt`) may be attached as metadata, but the graph's
  identity never depends on *when* it was built — two graphs built from the
  same facts at different times are identity-equal.

All identifiers (domain/node/edge ids, `type`, `status`, `relationship`)
must match `IDENTIFIER_PATTERN` in `src/financial/graph/identity.js`:
lowercase letters and digits, `-`/`_` as internal separators.

## Validation

`validateGraph(graph, { nodeTypes?, relationships? })` in
`src/financial/graph/validation/validateGraph.js` returns a structured
result — `{ valid: boolean, errors: Issue[], warnings: Issue[] }`, each issue
carrying a stable `code`, a human-readable `message`, and a best-effort
`path`. It never mutates or repairs its input.

Checks performed: malformed graph/node/edge/domain shape, duplicate node
id, duplicate edge id, duplicate domain id, missing source node, missing
target node, unknown/invalid domain, invalid or (optionally) unknown node
type, invalid or (optionally) unknown relationship, self-reference, and
domain-hierarchy issues (missing/self-referencing `parentId`).

Construction (`createGraph`/`createNode`/`createEdge`/`createDomain`) and
validation are intentionally separate: construction only checks a single
item's own shape (right types, non-empty, identifier syntax); it never
inspects cross-references. `validateGraph` is the only place that checks
whether the graph is internally consistent as a whole. Invalid data is
never silently repaired by either step.

## Immutability

Every value returned by `createGraph`/`createNode`/`createEdge`/
`createDomain` is `Object.freeze`d (including the `nodes`/`edges`/`domains`
collections), matching the pattern already used in
`financialSpatialAdapter.js`. There is no mutable global singleton graph —
every function is pure and takes/returns plain data.

Updates are expressed as pure transforms that return a **new** graph,
leaving the input untouched: `withNode`, `withEdge`, `withDomain` (add, or
replace an existing item of the same id), `cloneGraph` (independent copy,
deep-equal content), `serializeGraph`/`deserializeGraph` (JSON round-trip —
plain data needs no custom encoding).

## Layer 4B: Financial Graph Engine core

`src/financial/graph/engine/` — a read-only, deterministic query and
traversal layer over a Layer 4A `FinancialGraph`. It reuses Layer 4A's
`createGraph`/`validateGraph` as its only source of truth for graph shape;
it defines no second graph model and adds no graph library.

Full architectural chain this layer sits in (only the first box is
implemented so far):

```
Existing Financial Domain          (useAssets, useDebt, useTransactions, ... — unchanged)
        ↓
Financial Graph Engine              (src/financial/graph/ — Layer 4A contracts + Layer 4B engine, THIS layer)
        ↓
Graph-to-Visualization Adapter      (not built yet)
        ↓
Spatial Visualization Model         (src/spatial/contracts.js — existing, untouched)
        ↓
Spatial Runtime                     (src/spatial/runtime/ — existing, untouched)
        ↓
Motion Engine                       (src/motion/ — existing, untouched)
```

### Engine responsibilities

`createFinancialGraphEngine(graphInput, validationOptions?)` in
`src/financial/graph/engine/graphEngine.js`:

1. Normalizes `graphInput` through Layer 4A's `createGraph` (accepts either
   a plain graph-shaped object or an already-`createGraph`d graph).
2. Runs Layer 4A's `validateGraph` and **refuses to build** if the graph is
   invalid — an engine is never constructed over inconsistent data (a
   dangling edge reference, a duplicate id), because index invariants like
   "every edge's source/target resolves to a real node" depend on it.
3. Builds a set of indexes once (see Indexing) and returns a frozen object
   of query/traversal functions closed over those indexes.

### Public API

```
getGraph()                                   → FinancialGraph
validate(options?)                           → ValidationResult (Layer 4A validateGraph, delegated)
serialize()                                  → string           (Layer 4A serializeGraph, delegated)

getNode(nodeId)                              → GraphNode | null
hasNode(nodeId)                              → boolean
getEdge(edgeId)                              → GraphEdge | null
hasEdge(edgeId)                              → boolean
getDomain(domainId)                          → GraphDomain | null
hasDomain(domainId)                          → boolean

getNodes()                                   → GraphNode[]     (frozen — the graph's own array)
getEdges()                                   → GraphEdge[]     (frozen)
getDomains()                                 → GraphDomain[]   (frozen)

getNodesByDomain(domainId)                   → GraphNode[]     (frozen, possibly empty)
getNodesByType(type)                         → GraphNode[]     (frozen, possibly empty)
getEdgesByRelationship(relationship)         → GraphEdge[]     (frozen, possibly empty)

getConnectedEdges(nodeId)                    → GraphEdge[]     (every edge touching nodeId, either side)
getNeighbors(nodeId)                         → GraphNode[]     (the node at the other end of each)
getOutgoingNeighbors(nodeId)                 → GraphNode[]     (nodeId is source, any relationship)
getIncomingNeighbors(nodeId)                 → GraphNode[]     (nodeId is target, any relationship)
getConnectedNeighborhood(nodeId, { maxDepth }?) → GraphNode[]  (bounded BFS, undirected, deduplicated)
getRelationships(sourceId, targetId)         → GraphEdge[]     (edges directly between two nodes)
getRelatedNodes(nodeId, relationship, dir?)  → GraphNode[]     (dir: "outgoing" default | "incoming")

withNode(node)                               → FinancialGraphEngine  (new engine; source engine unchanged)
withEdge(edge)                               → FinancialGraphEngine  (new engine; source engine unchanged)

selectNode(nodeId)                           → GraphSelection  ({ nodeId })
clearSelection()                             → GraphSelection  ({ nodeId: null })
getSelection()                               → GraphSelection  (current per-engine-instance selection)
```

Not every name from the brief was implemented literally —
`getRelationship()` became `getRelationships(sourceId, targetId)` because
more than one edge can legitimately connect the same two nodes (different
relationships), so a plural, array-returning result is the correct shape.
"Get connected nodes" is `getNeighbors` (undirected); "incoming/outgoing
connections" are the new `getIncomingNeighbors`/`getOutgoingNeighbors`;
"bounded traversal depth" / "connected neighborhood" is
`getConnectedNeighborhood`. "Add/register node/edge" is `withNode`/`withEdge`
— reusing Layer 4A's own `withNode`/`withEdge` transforms, so "registering"
an entity produces a new engine rather than mutating the existing one, per
the immutability guarantee carried forward from Layer 4A.

### Indexing

Built once, in a single O(nodes + edges) pass, at engine construction
(`buildIndex` in `graphEngine.js`):

- `nodeById`, `edgeById`, `domainById` — `Map<id, item>` for O(1) lookup.
- `nodesByDomain`, `nodesByType` — `Map<key, GraphNode[]>`.
- `edgesByNode` — `Map<nodeId, GraphEdge[]>`, both endpoints (the adjacency
  index); powers `getConnectedEdges`/`getNeighbors`/`getConnectedNeighborhood`
  without scanning `graph.edges`.
- `edgesBySource`, `edgesByTarget` — direction-specific adjacency, power
  `getOutgoingNeighbors`/`getIncomingNeighbors`/`getRelatedNodes`.
- `edgesByRelationship` — `Map<relationship, GraphEdge[]>`.

Every array value in these maps is `Object.freeze`d exactly once, then
returned **by reference** on every later call — safe because neither the
underlying graph nor the index changes after construction, and cheap
because no per-call copy is needed. No graph library, force-directed layout,
or pathfinding was added; nothing observed in Money Mind's current
requirements needs more than direct/one-hop lookups.

### Traversal

At minimum: `node → getConnectedEdges → node → getNeighbors`. Also
supported: `node → relationship → related nodes` via the single generic
`getRelatedNodes(nodeId, relationship, direction)`, which covers every
semantic query in the spec ("nodes funded by X", "nodes contributing to X",
"nodes reducing X", "nodes increasing X", ...) as one function parameterized
by the canonical Layer 4A relationship identifier and a direction, rather
than one hardcoded function per relationship string. `getOutgoingNeighbors`/
`getIncomingNeighbors` give the same directed split without requiring a
specific relationship (any edge touching the node in that direction).

`getConnectedNeighborhood(nodeId, { maxDepth = 1 })` adds bounded,
deterministic multi-hop traversal: a plain queue-based breadth-first search
over the same adjacency index, deduplicated (a node reachable by more than
one path still appears once), ordered nearest-hop-first. `maxDepth` must be
a positive integer — this is intentionally the only traversal function with
an unbounded-work risk, so it is the only one required to declare a limit.
No general graph algorithm library, layout engine, or pathfinding
(shortest-path, cycle detection, etc.) was added — nothing in Money Mind's
current requirements needs more than "nodes within N hops."

Traversal order is deterministic: `getConnectedEdges` follows `graph.edges`
declaration order (via `edgesByNode`, itself built by a single forward pass
over `graph.edges`); `getNeighbors`/`getOutgoingNeighbors`/
`getIncomingNeighbors` follow their respective edge index in the same order;
`getConnectedNeighborhood` follows BFS discovery order. A node reachable by
more than one edge appears once per edge in `getNeighbors` (but only once,
total, in `getConnectedNeighborhood`, which is a *set* of reachable nodes,
not a per-edge enumeration) — callers wanting a unique set from
`getNeighbors` can wrap the result in `new Set(...)`.

### Domain & type & relationship queries

`getNodesByDomain`, `getNodesByType`, and `getEdgesByRelationship` are not
hardcoded per value (no `getIncomeNodes()`, no `getExpenseNodes()`) — one
function each, parameterized by the canonical Layer 4A identifier, so a
future domain (`goals`, `cashFlow`, ...) or relationship needs no engine
change. A well-formed identifier with no matches returns an empty array (a
legitimate state, e.g. a domain with no nodes yet); a malformed identifier
throws (see Error handling) since that is essentially always a caller bug.

### Selection

A `GraphSelection` is a plain, frozen value — `{ nodeId }` — matching the
*shape* of the existing `SpatialSelection` typedef in
`src/spatial/contracts.js` (`{ nodeId, edgeId }`). Unlike that typedef, the
engine holds the current selection as **per-instance** state: one private
`let` inside the `createFinancialGraphEngine` closure, mutable only through
`selectNode`/`clearSelection`, readable only through `getSelection()` — no
module-level/global singleton (two engines built from the same graph have
independent selection), and no way for a caller to reach or replace the
variable directly. `selectNode` on a node id that doesn't exist throws
`NODE_NOT_FOUND` and leaves the current selection unchanged, rather than
fabricating a selection or clearing state as a side effect of a failed call.

This is semantic, graph-level selection only — no Three.js, no React, no
camera/animation/world-coordinate state, and it does not duplicate
`MotionProvider`, which separately owns *visual* focus/camera state for the
spatial scene. Because selection is stateful, `getSelection()` is the one
function in this API whose result depends on call order; every query and
traversal function is a pure function of the graph and its arguments.

### Immutability

The engine object itself is `Object.freeze`d, as is every collection it
returns. Its indexes (the `Map`s built in `buildIndex`) live only in the
`createFinancialGraphEngine` closure — there is no property exposing them,
so a caller has no path to reach or mutate internal engine state, stronger
than convention-based privacy (e.g. an `_index` class field) would give.

The one piece of genuine internal state — the current selection — is
likewise unreachable except through `selectNode`/`clearSelection`/
`getSelection`; it cannot be replaced, reset, or corrupted from outside.
"Registering" a node or edge (`withNode`/`withEdge`) never mutates state at
all: both build a **new** graph via Layer 4A's own `withNode`/`withEdge`
transforms, then a **new** engine (re-validated, re-indexed) over it. The
engine `withNode`/`withEdge` was called on — including its indexes and its
current selection — is completely untouched.

### Error handling

`GraphEngineError` (`src/financial/graph/engine/errors.js`) carries a stable
`code` (one of `GRAPH_ENGINE_ERROR_CODES`), a message, and a `details` bag.
It is distinct from Layer 4A's `validateGraph` issue list: `validateGraph`
reports on the shape of graph *data*; `GraphEngineError` reports on misuse
of the *engine* built from data already known valid.

Two deliberately different policies, documented in `graphEngine.js`:

- **Existence lookups** (`getNode`/`getEdge`/`getDomain`/`hasNode`/`hasEdge`/
  `hasDomain`) return `null`/`false` for "not found" — mirrors `Map.get`; a
  missing id is a normal query outcome, never fabricated.
- **Traversal anchored on a node** (`getConnectedEdges`/`getNeighbors`/
  `getOutgoingNeighbors`/`getIncomingNeighbors`/`getConnectedNeighborhood`/
  `getRelationships`/`getRelatedNodes`/`selectNode`) throws `NODE_NOT_FOUND`
  if that anchor was never in the graph — there is no meaningful result for
  an id the graph never had, and that is almost always a caller bug (e.g. a
  stale id) worth surfacing loudly rather than silently returning an empty
  list indistinguishable from "exists but isolated."
- Bucket queries, `getRelatedNodes`, and `getConnectedNeighborhood` throw
  `INVALID_DOMAIN` / `INVALID_QUERY` / `INVALID_RELATIONSHIP` only for a
  **malformed** identifier, an invalid `direction`, or a non-positive-integer
  `maxDepth`; a well-formed-but-absent value returns an empty array rather
  than throwing.
- Building an engine over invalid graph data throws `INVALID_GRAPH`, with
  Layer 4A's `validateGraph` issues attached in `details.errors` — this
  includes the graph produced internally by `withNode`/`withEdge`, so
  registering an edge with a missing source/target is rejected the same way
  as an invalid graph passed to the constructor directly.

### Serialization

`serialize()` delegates to Layer 4A's `serializeGraph(getGraph())` — plain
JSON, byte-identical to calling `serializeGraph` directly on the engine's
graph. It preserves every canonical identity (graph/node/edge/domain ids),
every relationship, and the graph's own array ordering (nodes/edges/domains
in the order they were constructed) exactly, since it is ordinary
`JSON.stringify` over already-plain, already-frozen data. No runtime-only
state is ever included, because the engine has none to include: indexes are
derived (rebuildable from `nodes`/`edges` alone) and are never part of the
graph, and selection is explicitly excluded (it is per-instance interaction
state, not part of the financial graph itself). Round-tripping
`serialize()` output through Layer 4A's `deserializeGraph` and back into
`createFinancialGraphEngine` reconstructs an equivalent engine — verified by
test.

### Performance strategy

Every implemented lookup/traversal function is O(1) amortized or O(k) where
k is the required output size (e.g. `getNeighbors` must produce k neighbor
objects, so O(k) is optimal) — none scans the full node/edge arrays. Index
construction is a single O(nodes + edges) pass. No database, cache layer,
GraphQL, or external graph engine was introduced; Money Mind's financial
graphs are expected to stay in the hundreds-to-low-thousands of
entities, well within what plain `Map`s handle without added
infrastructure. Revisit only if a concrete, measured need appears.

### Financial-calculation boundary

The engine represents relationships; it performs no financial math. Net
worth, cash flow, debt payoff, investment return, and budget variance stay
exactly where they already live — `useFinancialKPIs`,
`src/financial/projection/projectFinancials.js`, and the page-level
calculators. Nothing in `src/financial/graph/engine/` sums, projects, or
scores anything.

### Spatial boundary

Nothing in `src/financial/graph/engine/` imports Three.js, React, the DOM,
or anything from `src/spatial/` or `src/motion/` — this was verified by
inspection of every import in the new files. `src/spatial/runtime/` and
`src/motion/` were not modified by Layer 4B, so both Layer 2C (visual
runtime) and Layer 3 (motion/interaction) are unaffected by construction,
not merely by re-running their validation — there is no code path connecting
the graph engine to either.

## Layer 4C: Graph Transformations & Operations

`src/financial/graph/transform/graphTransform.js` — deterministic, non-
mutating operations that derive a **new, valid `FinancialGraph`** from an
existing `FinancialGraph` or `FinancialGraphEngine`. It transforms graph
*structure* only; it reuses Layer 4A's contracts/validation and Layer 4B's
engine directly rather than introducing a second graph model, a second
validator, or a second traversal implementation.

Full chain, with the next unbuilt step named for clarity:

```
Real Financial Data
        ↓
Financial Domain Model              (useFinancialKPIs, useAssets, useDebt, ... — unchanged)
        ↓
Layer 4A — Graph Contracts          (src/financial/graph/contracts.js, validation/, identity.js)
        ↓
Layer 4B — Financial Graph Engine   (src/financial/graph/engine/)
        ↓
Layer 4C — Graph Transformations    (src/financial/graph/transform/ — THIS layer)
        ↓
Layer 4D — Graph → Spatial Adapter  (not built yet)
        ↓
Spatial Runtime → Motion Engine → 3D Money Mind   (existing, untouched)
```

### The key distinction: structure vs. meaning

Layer 4C answers "which nodes/edges should be visible in this view?" — never
"what is this node's dollar value?" Every transformation only adds, removes,
or filters nodes/edges/domains; none of them read or write a `metadata`
amount, recompute a KPI, or otherwise touch financial meaning. Net worth,
cash flow, debt payoff, investment return, and budget variance remain
exclusively in `useFinancialKPIs` and
`src/financial/projection/projectFinancials.js` — completely outside this
module, which was verified by inspecting every line of `graphTransform.js`
for arithmetic on financial fields (there is none; the only numeric logic
anywhere in the file is `Math.max(1, graph.nodes.length)`, a traversal depth
bound, not a financial calculation).

### Implemented transformations

Every function returns a `FinancialGraph` (never a bare array — returning
arrays of nodes/edges is Layer 4B's job, not Layer 4C's), so the output of
one is always valid input to the next, and to `createFinancialGraphEngine`:

- **`projectGraph(graphOrEngine, { nodeIds?, domains?, types? })`** — the one
  general multi-criteria node selector everything else below is a thin,
  named alias for. Retains every node matching *any* given criterion (a
  union): explicit `nodeIds` (each must already exist — a stale id throws
  `NODE_NOT_FOUND`, the same policy Layer 4B uses for anchored traversal),
  `domains`, and `types` (both reuse Layer 4B's own `getNodesByDomain`/
  `getNodesByType` directly — a well-formed-but-currently-unmatched value
  legitimately contributes nothing, not an error). At least one criterion
  must be given, or it throws `INVALID_PARAMETER` — an entirely empty call
  is a near-certain caller mistake, not a meaningful "select nothing."
- **`selectNodesByDomains(graphOrEngine, domainIds)`** — a domain view:
  `projectGraph(g, { domains: domainIds })`. Covers "Income view," "Debt
  view," etc., and domain-to-domain views (pass more than one id) — using
  whichever domains Layer 4A's canonical registry (or a graph's own
  declared domains) defines, never a hardcoded list.
- **`selectNodesByTypes(graphOrEngine, types)`** — `projectGraph(g, { types
  })`.
- **`selectNodesByIds(graphOrEngine, nodeIds)`** — `projectGraph(g, {
  nodeIds })`. Also covers "extract relationships involving these selected
  nodes": an induced subgraph over an explicit node set always includes
  every edge between its members, by construction.
- **`selectEdgesByRelationships(graphOrEngine, relationships)`** — a
  relationship view, edge-first rather than node-first: retains every edge
  with any of the given relationships (via Layer 4B's
  `getEdgesByRelationship`), then only the nodes actually touched by a
  retained edge — *not* every node in a matching domain/type. A node that
  happens to share a domain/type with a relevant node, but has no edge of
  that relationship itself, is correctly excluded (verified by test: an
  isolated same-domain node never appears in a relationship view).
- **`extractNeighborhood(graphOrEngine, nodeId, { maxDepth = 1, includeAnchor = true })`**
  — subgraph extraction around a node. Reuses Layer 4B's
  `getConnectedNeighborhood` verbatim for the traversal; this function only
  turns that node list into a valid induced graph.
- **`selectNodeRelationships(graphOrEngine, nodeId, { direction = "both", relationships? })`**
  — relationship view anchored on one node: the node, every edge touching it
  in the given direction (`"both" | "outgoing" | "incoming"`), optionally only
  the given relationships, and the nodes at the other ends. Reuses Layer 4B's
  `getConnectedEdges` adjacency index. The anchor is always retained, so "no
  matching relationship" is a valid one-node view, not an empty graph.
- **`selectRelationshipsBetween(graphOrEngine, sourceId, targetId, { directed = false, relationships? })`**
  — source → target view: both nodes plus the edges directly between them
  (both directions by default; `directed: true` keeps only source → target).
  Reuses Layer 4B's `getRelationships`. Both endpoints are always retained.
- **`composeGraphTransforms(...steps)`** — pipeline composition, see
  "Composition" below.
- **`extractConnectedComponent(graphOrEngine, nodeId)`** — the full
  connected component containing `nodeId`. A thin reuse of Layer 4B's
  *bounded* `getConnectedNeighborhood`, called with `maxDepth =
  graph.nodes.length` (a safe upper bound — no simple path in an N-node
  graph exceeds N−1 hops). No second traversal algorithm exists in this
  file.

### Filtering semantics

"Filtering" is deliberately not a generic predicate/query language — every
filter is one of exactly three fixed, named criteria (`nodeIds`, `domains`,
`types` in `projectGraph`; `relationships` in
`selectEdgesByRelationships`), combined only by union. This covers every
example in the specification (domain selection, relationship selection,
node selection, edge selection, source/target relationships via
`getRelatedNodes`/`getRelationships` already in Layer 4B, and as graph views
via `selectNodeRelationships`/`selectRelationshipsBetween`) with a handful of
small functions instead of an open-ended expression evaluator.

Arbitrary predicate filtering (`(node) => boolean`) was deliberately **not**
added: every current view is expressible with the named criteria above, and a
predicate API would make view definitions opaque to provenance
(`metadata.lineage` could no longer record *what* was selected). A caller who
genuinely needs a one-off predicate can write it as a `composeGraphTransforms`
step, which is still validated and re-frozen.

### Subgraph semantics (the induced-subgraph rule)

Every transformation reduces to one of two shared private primitives:

- **`induceSubgraph(engine, keepNodeIds, ...)`** (node-first): retained
  nodes = the keep-set, in the source graph's original `nodes` order;
  retained domains = those referenced by a retained node **plus their full
  parent chain**, in original `domains` order; retained edges = only those whose source **and** target
  are both retained, in original `edges` order.
- **`induceFromEdgeIds(engine, keepEdgeIds, ...)`** (edge-first, used only
  by `selectEdgesByRelationships`): retained edges = the keep-set, in
  original order; retained nodes = only those touched by a retained edge (plus explicit anchor
  nodes for the node-anchored relationship views);
  retained domains = those referenced by a retained node plus their parent
  chains.

> **Fix (2026-09-26, found by the Layer 4D tests):** both primitives
> originally kept only *directly* referenced domains. A retained node in a
> sub-domain (e.g. `savings-emergency` → parent `savings`) produced a derived
> graph whose domain named a dropped parent, which `validateGraph` rejects
> (`DOMAIN_PARENT_MISSING`). The `INVALID_DERIVED_GRAPH` safety net meant no
> invalid graph ever escaped, but every view over a hierarchical graph threw.
> A shared `retainDomains` helper now keeps ancestor chains. Covered by a
> hierarchy test in `validate-financial-graph-transform.mjs`.

Both filter the **original** arrays by membership in a computed keep-set —
never rebuild or reorder them — which is what makes canonical ordering
automatic (see Determinism) and dangling references structurally impossible
(see Subgraph extraction / dangling-edge prevention below): an edge survives
`induceSubgraph` only when both endpoints do; a node survives
`induceFromEdgeIds` only because some retained edge names it.

### Domain-view strategy

Domain views use exactly the domain identifiers a graph itself declares
(via Layer 4B's `getNodesByDomain`, which is already open-vocabulary — see
Layer 4B docs above). Nothing in Layer 4C hardcodes `income`/`expenses`/etc.
— `selectNodesByDomains` works identically for a domain Layer 4A doesn't
yet know about (e.g. a future `goals` domain) the moment a graph declares
it, with zero code change.

### Relationship-view strategy

Symmetric to domain views: `selectEdgesByRelationships` uses whatever
relationship identifiers a graph's edges actually carry (via Layer 4B's
`getEdgesByRelationship`), never a hardcoded relationship list. The starter
vocabulary in `relationships/knownRelationships.js` remains just that — a
reference list, not something this module special-cases.

### Projection strategy

`projectGraph` *is* the projection operation the specification describes
("nodes: selected IDs, selected domains, selected types; edges: only
relationships between retained nodes") — implemented as exactly that: a
union of the three node criteria, then the induced-subgraph rule for edges.
`selectNodesByDomains`/`selectNodesByTypes`/`selectNodesByIds` are not a
duplicate representation of this — they are one-line aliases calling
`projectGraph` with a single field set, kept only because named call sites
(`selectNodesByDomains(g, ["debt"])`) read better than
`projectGraph(g, { domains: ["debt"] })` everywhere a single criterion is
all that's needed.

### Composition (pipelines): implemented

`composeGraphTransforms(...steps)` returns a function
`(graphOrEngine, validationOptions?) => FinancialGraph` that runs each step
`(graph) => FinancialGraph` left to right:

```js
const debtFocus = composeGraphTransforms(
  (g) => selectNodesByDomains(g, ["debt", "net-worth"]),
  (g) => extractNeighborhood(g, debtNodeId),
  (g) => selectEdgesByRelationships(g, ["reduces"]),
)
const view = debtFocus(engine)
```

- Every step's output is checked with Layer 4A's `validateGraph`; an invalid
  step result throws `INVALID_DERIVED_GRAPH` (never repaired).
- Every step's output is re-normalized through Layer 4A's `createGraph`, so a
  hand-written step cannot leak a mutable graph.
- The result is identical to chaining the calls by hand (verified by test).
- Provenance: every derived graph now carries `metadata.lineage`, an ordered,
  frozen list of `{ operation, parameters }` that accumulates across steps.
  `metadata.operation`/`parameters` still describe the most recent step.

### Graph merge decision: deferred

Graph merge (combining two separate `FinancialGraph`s into one)
was evaluated and **not implemented**. No current Money Mind consumer
builds more than one `FinancialGraph` at a time — `App.jsx`'s
`spatialFinancialModel` derives a single model from one signed-in user's
KPIs — so there is no concrete merge requirement to design against yet
(e.g., what should happen to two different graphs' `id`/`version`, or a
node id present in both, is unanswerable without a real use case dictating
the right default). Revisit if a genuine need appears — multi-account
aggregation, household/individual graph combination, or similar — and
design merge semantics against that actual requirement rather than
speculatively now.

### Snapshot decision: not needed, already covered

An immutable, semantic (non-rendering) "snapshot" capability already exists
without any Layer 4C addition: every transformation's return value is
itself a frozen, immutable `FinancialGraph` — a snapshot by definition —
and Layer 4A's `cloneGraph`/`serializeGraph`/`deserializeGraph` already
provide deterministic round-tripping (verified directly against a Layer 4C
derived graph by test). Introducing a dedicated `GraphSnapshot` type would
only duplicate `FinancialGraph` for no behavioral gain, so none was added.

### Immutability

Every transformation is a pure function: it reads its input graph/engine
and returns a brand-new graph, never touching the source. `resolveEngine`
(the internal helper that accepts either a `FinancialGraph` or a
`FinancialGraphEngine`) never mutates whichever engine it's given, and
never mutates the graph or engine it was passed — verified by test
(`engine.getGraph()` is reference-identical before and after any
transformation). Every derived graph is frozen exactly the way Layer 4A's
`createGraph` already freezes any graph (collections included).

### Validation / error handling

Every derived graph is checked with Layer 4A's `validateGraph` before being
returned — no second/parallel validator exists. Because both induced-
subgraph primitives are constructed so an edge only ever survives when both
endpoints do, this should never fail in practice; it exists as a safety net
(`INVALID_DERIVED_GRAPH`, a Layer 4C bug if it ever fires, not a caller
error). Two new codes were added to the *same* `GRAPH_ENGINE_ERROR_CODES`
enum Layer 4B already defined (`src/financial/graph/engine/errors.js`),
reusing `GraphEngineError` itself rather than introducing a parallel error
class:

- **`INVALID_PARAMETER`** — malformed or insufficient transformation
  arguments (a non-array/non-string id list; `projectGraph` called with
  every criterion empty; `selectEdgesByRelationships` called with an empty
  list).
- **`INVALID_DERIVED_GRAPH`** — the safety net above.

`NODE_NOT_FOUND`/`INVALID_DOMAIN`/`INVALID_RELATIONSHIP`/`INVALID_QUERY`
are all *reused* from Layer 4B as-is (e.g. an explicit `nodeIds` entry that
doesn't exist throws the identical `NODE_NOT_FOUND` Layer 4B's own anchored
traversal throws). A well-formed criterion that currently matches nothing
(an empty-but-declared domain, a relationship no edge currently uses)
legitimately returns a valid empty graph, never an error — the same policy
Layer 4B established for its own bucket queries.

### Determinism

Two rules, both already required by Layer 4A/4B and carried forward
unchanged:

1. Every filtered array (nodes/domains/edges) is derived by filtering the
   **source graph's own arrays** by set membership — never re-sorted, never
   rebuilt from a `Map`/`Set` iteration order — so output order depends only
   on the source graph's order, never on the order criteria were supplied
   in (verified by test: `selectNodesByDomains(g, ["debt","income"])` and
   `selectNodesByDomains(g, ["income","debt"])` produce byte-identical
   output).
2. No random ids, no `Date.now()`, no non-deterministic iteration. A derived
   graph's `metadata.parameters` records criteria arrays pre-sorted, so even
   the *record of what was asked for* doesn't vary with call-site argument
   order.

### Performance considerations

Every transformation is a small, fixed number of passes over the source
graph's `nodes`/`domains`/`edges` arrays (each independently O(n) or O(e)),
plus whatever Layer 4B index lookups it reuses (already O(1) amortized per
key, per the Layer 4B docs above) — no quadratic behavior, no repeated full
scans beyond what a single filter pass requires, and no graph
reconstruction beyond the one derived graph actually being built.
`extractConnectedComponent`'s reuse of `getConnectedNeighborhood` is
O(visited nodes + their edges), same as Layer 4B's own bound. Nothing here
was optimized beyond what's already justified by these bounds.

### Relationship to Layer 4B

Layer 4C never re-implements anything Layer 4B already provides: node/edge/
domain existence, bucket queries by domain/type/relationship, and bounded
neighborhood traversal are all called directly on a
`FinancialGraphEngine`(constructed on demand, via `resolveEngine`, if a
caller passes a plain `FinancialGraph` instead). Layer 4C's only original
logic is turning a Layer 4B query result (a node/edge list) into a new,
independently valid `FinancialGraph`.

### Relationship to Layer 4D

Layer 4D (`src/visualization/adapters/financialGraphSpatialAdapter.js`,
documented in `graph-spatial-adapter.md`) consumes a `FinancialGraph` —
typically a Layer 4C view — and maps it to a `SpatialScene`. Layer 4C itself
imports nothing from `src/visualization/`; the dependency points one way only.

### Explicit non-responsibilities

Layer 4C does not: perform any financial calculation; store or mutate
Firebase/Firestore data; import Three.js, React, or the DOM; import
anything from `src/spatial/` or `src/motion/`; introduce a graph library,
physics engine, or layout algorithm; implement pathfinding, cycle
detection, or any general graph algorithm beyond bounded BFS reuse; or
implement graph merge (deferred, see above).

## Relationship to the existing `v2GraphEngine` flag

Unchanged from Layer 4A — `featureFlags.v2GraphEngine` still gates only the
existing domain → child-line-item fan-out (chapter 5). Neither Layer 4B's
engine nor Layer 4C's transformations are wired to that flag, to
`App.jsx`, or to any UI; both are exercised only by their own test scripts.

## Future expansion strategy

- **New domains** (e.g. `goals`, `cashFlow`, `netWorth`) can be declared the
  moment a real model backs them, by adding a `GraphDomain` to a graph's
  `domains` array — no contract or engine change required (the engine's
  domain queries are already parameterized, not hardcoded).
- **New relationships** are just new identifier strings; `knownRelationships.js`
  can grow, and any caller wanting stricter guarantees passes its own
  vocabulary to `validateGraph` or to `getRelatedNodes`.
- **A graph-to-visualization adapter** (a future layer) would live under
  `src/visualization/adapters/`, consuming the Layer 4B engine and producing
  a `SpatialScene` — the same boundary `financialSpatialAdapter.js` already
  respects for its narrower model. Not built yet.
- **A graph library** (graphology, cytoscape, etc.) remains unnecessary.
  Layer 4B's indexed `Map`-based lookups cover every traversal Money Mind
  currently needs (one-hop neighbors, connected edges, directed relationship
  queries) in optimal time; nothing requires layout algorithms or
  multi-hop pathfinding yet. Add a library only when a concrete, implemented
  feature needs one.
- **Graph composition/merge** — deferred; see Layer 4C's "Composition
  decision" above. Design it against a real multi-graph requirement when one
  exists, not speculatively.
- **A Layer 4D Graph → Spatial Adapter** — the next unbuilt step; see
  Layer 4C's "Relationship to Layer 4D" above.

## Tests

Three plain Node scripts — no test framework — mirroring the assert style of
`scripts/v2/layer3-browser-acceptance.mjs`:

- `scripts/v2/validate-financial-graph-contracts.mjs` (`npm run
  test:financial-graph`, Layer 4A): a valid graph, an empty graph, duplicate
  node/edge ids, missing source/target, invalid and unknown-vocabulary
  relationships, an unknown domain, a prohibited self-reference, a malformed
  graph, deterministic identity, JSON serialization round-tripping, and
  immutable transformation behavior.
- `scripts/v2/validate-financial-graph-engine.mjs` (`npm run
  test:financial-graph-engine`, Layer 4B, 77 assertions): graph creation, a
  valid and an invalid graph (refused at construction), node/edge lookup,
  domain/type/relationship queries (including malformed-identifier throws),
  domain membership (`hasDomain`), undirected/outgoing/incoming neighbor
  queries, bounded neighborhood traversal (1-hop and 2-hop, deduplication,
  `maxDepth` validation), connected-edge lookup, missing node/edge,
  duplicate-identity protection, deterministic results across independently
  built engines, immutable internal state (frozen collections, frozen engine
  object, no path to the internal indexes), stateful selection and
  deselection (including per-instance isolation and that a rejected
  `selectNode` leaves the prior selection untouched), immutable node/edge
  registration (`withNode`/`withEdge` return a new engine, leave the source
  engine unchanged, and reject an edge with a missing endpoint), and
  deterministic serialization round-tripping — using a small fixed fixture
  (Income → Savings, Income → Expenses, Savings/Debt/Investments →
  Net Worth) built entirely from the canonical Layer 4A relationship
  vocabulary. No production data, no Firebase, no Firestore writes.
- `scripts/v2/validate-financial-graph-transform.mjs` (`npm run
  test:financial-graph-transform`, Layer 4C, 46 assertions): domain
  filtering, node filtering by id and by type, edge/relationship filtering
  (including proof that an unrelated same-domain isolated node is excluded),
  subgraph extraction, bounded neighborhood extraction (with and without the
  anchor), multi-criteria projection, valid empty results (a declared-but-
  empty domain), invalid transformation parameters (missing criteria,
  non-string id entries, an empty relationship list — all `INVALID_PARAMETER`),
  dangling-edge prevention, deterministic ordering (independent of the order
  criteria were supplied in), immutability (the source graph is
  reference-identical before/after, derived output is frozen), a 3-stage
  transformation pipeline (domain filter → neighborhood → relationship
  filter), independent `validateGraph` re-validation of derived output,
  serialization round-tripping of a derived graph through Layer 4A's
  existing `serializeGraph`/`deserializeGraph`, identity preservation (a
  derived graph keeps its source's `id`/`version`, records provenance only
  in `metadata`), and connected-component extraction (an isolated fixture
  node correctly forms its own singleton component). Test items 15
  ("snapshot behavior") and 17 ("conflicting identity handling") are
  exercised only to the extent documented above — no new snapshot type and
  no composition/merge were implemented, per the deferral decisions above.
  Same fixture as Layer 4B, plus a declared empty `goals` domain and an
  edge-less "dormant" node. No production data, no Firebase, no Firestore
  writes.

No repository-wide test runner or typechecker exists for this project (a
plain Vite + JS app — confirmed by inspecting `package.json` and finding no
`vitest`/`jest`/`.test.` files tracked in git), so these three scripts are the
full extent of "existing test infrastructure" available to reuse, consistent
with how Layer 3's own validation (`layer3-browser-acceptance.mjs`) is
structured.
