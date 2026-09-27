// Layer 11: pure operations over the module registry (validation, visibility).
// Deterministic; no React, no rendering, no financial data.

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const REQUIRED = ["id", "label", "description", "icon", "tone", "order", "spatial", "permissions", "submodules"]

export class ModuleRegistryError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = "ModuleRegistryError"
    this.details = details
  }
}

/** Rejects a malformed registry (never repairs it). Returns the registry unchanged. */
export function validateModuleRegistry(registry) {
  if (!Array.isArray(registry)) throw new ModuleRegistryError("Module registry must be an array")
  const ids = new Set()
  const slots = new Set()
  registry.forEach((module, index) => {
    for (const field of REQUIRED) {
      if (module?.[field] === undefined || module?.[field] === null || module?.[field] === "") throw new ModuleRegistryError(`Module #${index} is missing "${field}"`, { index, field })
    }
    if (!ID.test(module.id)) throw new ModuleRegistryError(`Module id "${module.id}" must be a lowercase kebab-case identifier`, { id: module.id })
    if (ids.has(module.id)) throw new ModuleRegistryError(`Duplicate module id "${module.id}"`, { id: module.id })
    ids.add(module.id)
    if (!Number.isInteger(module.order)) throw new ModuleRegistryError(`Module "${module.id}" order must be an integer`, { id: module.id })
    if (!Number.isInteger(module.spatial.slot) || module.spatial.slot < 0) throw new ModuleRegistryError(`Module "${module.id}" spatial.slot must be a non-negative integer`, { id: module.id })
    if (slots.has(module.spatial.slot)) throw new ModuleRegistryError(`Spatial slot ${module.spatial.slot} is used twice`, { id: module.id })
    slots.add(module.spatial.slot)
    if (!Array.isArray(module.permissions) || !Array.isArray(module.submodules)) throw new ModuleRegistryError(`Module "${module.id}" permissions/submodules must be arrays`, { id: module.id })
    const subIds = new Set()
    for (const sub of module.submodules) {
      if (!sub?.id || !ID.test(sub.id) || !sub.label) throw new ModuleRegistryError(`Module "${module.id}" has a malformed submodule`, { id: module.id, submodule: sub })
      if (subIds.has(sub.id)) throw new ModuleRegistryError(`Module "${module.id}" has duplicate submodule "${sub.id}"`, { id: module.id })
      subIds.add(sub.id)
    }
  })
  return registry
}

/**
 * The modules a user sees: flag-gated and permission-gated, in reading order.
 * @param {object[]} registry
 * @param {{ flags?: Record<string, boolean>, capabilities?: string[] }} [context]
 */
export function resolveVisibleModules(registry, { flags = {}, capabilities = ["authenticated"] } = {}) {
  validateModuleRegistry(registry)
  const granted = new Set(capabilities)
  return Object.freeze(
    registry
      .filter((module) => !module.featureFlag || flags[module.featureFlag] === true)
      .filter((module) => module.permissions.every((permission) => granted.has(permission)))
      .slice()
      .sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1)),
  )
}
