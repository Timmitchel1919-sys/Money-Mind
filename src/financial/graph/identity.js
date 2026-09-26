// Deterministic identity rules for the financial graph (Layer 4A). IDs are
// always derived from stable inputs — domain/type/key for nodes,
// source/relationship/target for edges — never random and never
// timestamp-based, so the same financial facts always produce the same
// graph shape. See docs/v2/architecture/financial-graph-engine.md.

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/

/** True for a lowercase identifier: letters/digits with "-" or "_" separators. */
export function isValidIdentifier(value) {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value)
}

function assertIdentifierPart(value, label) {
  const stringValue = String(value)
  if (!isValidIdentifier(stringValue)) {
    throw new TypeError(`${label} must be a lowercase identifier (letters, digits, "-" or "_"), got: ${JSON.stringify(value)}`)
  }
  return stringValue
}

/** Deterministic node id: stable for the same (domain, type, key). */
export function createNodeId(domain, type, key) {
  return [
    assertIdentifierPart(domain, "domain"),
    assertIdentifierPart(type, "type"),
    assertIdentifierPart(key, "key"),
  ].join("-")
}

/** Deterministic edge id: stable for the same (source, relationship, target). */
export function createEdgeId(source, relationship, target) {
  return [
    assertIdentifierPart(source, "source"),
    assertIdentifierPart(relationship, "relationship"),
    assertIdentifierPart(target, "target"),
  ].join("-")
}

export { IDENTIFIER_PATTERN }
