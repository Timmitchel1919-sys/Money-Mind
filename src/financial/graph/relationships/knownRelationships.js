// A starter relationship vocabulary for financial graph edges. Not
// exhaustive and NOT enforced by default — validateGraph only checks that a
// relationship is a well-formed identifier unless a graph producer opts into
// a closed vocabulary via validateGraph(graph, { relationships }).
// See docs/v2/architecture/financial-graph-engine.md.

export const KNOWN_RELATIONSHIPS = Object.freeze([
  "funds",
  "contributes_to",
  "belongs_to",
  "reduces",
  "increases",
  "owes",
  "pays",
  "supports",
  "depends_on",
])
