// Layer 11: pure operations over the module registry (validation, visibility).
// Deterministic; no React, no rendering, no financial data.

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const REQUIRED = ["id", "label", "description", "icon", "tone", "order", "spatial", "permissions", "submodules"]
const SUBMODULE_REQUIRED = ["id", "parentModuleId", "label", "availability", "destination", "navigation"]
const AVAILABILITY = new Set(["available", "unavailable"])
const DESTINATION_KINDS = new Set(["workspace", "action"])

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
  const workspaceRoutes = new Set()
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
    const subOrders = new Set()
    for (const sub of module.submodules) {
      for (const field of SUBMODULE_REQUIRED) {
        if (sub?.[field] === undefined || sub?.[field] === null || sub?.[field] === "") throw new ModuleRegistryError(`Module "${module.id}" has a submodule missing "${field}"`, { id: module.id, submodule: sub, field })
      }
      if (!ID.test(sub.id) || sub.parentModuleId !== module.id || !AVAILABILITY.has(sub.availability)) throw new ModuleRegistryError(`Module "${module.id}" has a malformed submodule`, { id: module.id, submodule: sub })
      if (subIds.has(sub.id)) throw new ModuleRegistryError(`Module "${module.id}" has duplicate submodule "${sub.id}"`, { id: module.id })
      subIds.add(sub.id)
      if (!DESTINATION_KINDS.has(sub.destination?.kind)) throw new ModuleRegistryError(`Submodule "${module.id}/${sub.id}" has an invalid destination`, { id: module.id, submodule: sub })
      if (sub.destination.kind === "workspace" && (!sub.destination.route || typeof sub.destination.route !== "string")) throw new ModuleRegistryError(`Submodule "${module.id}/${sub.id}" has no workspace route`, { id: module.id, submodule: sub })
      if (sub.destination.kind === "workspace" && workspaceRoutes.has(sub.destination.route)) throw new ModuleRegistryError(`Workspace route "${sub.destination.route}" is mapped more than once`, { route: sub.destination.route })
      if (sub.destination.kind === "workspace") workspaceRoutes.add(sub.destination.route)
      if (sub.destination.kind === "action" && (!sub.destination.action || !ID.test(sub.destination.action))) throw new ModuleRegistryError(`Submodule "${module.id}/${sub.id}" has no valid action`, { id: module.id, submodule: sub })
      if (!Number.isInteger(sub.navigation?.order) || sub.navigation.order < 1 || !["spatial"].includes(sub.navigation.restore)) throw new ModuleRegistryError(`Submodule "${module.id}/${sub.id}" has invalid navigation metadata`, { id: module.id, submodule: sub })
      if (subOrders.has(sub.navigation.order)) throw new ModuleRegistryError(`Module "${module.id}" has duplicate submodule order ${sub.navigation.order}`, { id: module.id })
      subOrders.add(sub.navigation.order)
      if (sub.icon !== undefined && (typeof sub.icon !== "string" || !sub.icon)) throw new ModuleRegistryError(`Submodule "${module.id}/${sub.id}" has an invalid icon`, { id: module.id, submodule: sub })
    }
  })
  return registry
}

export function findSubmodule(registry, moduleId, submoduleId, { availableOnly = false } = {}) {
  validateModuleRegistry(registry)
  const submodule = registry.find((module) => module.id === moduleId)?.submodules.find((candidate) => candidate.id === submoduleId) ?? null
  return availableOnly && submodule?.availability !== "available" ? null : submodule
}

export function findSubmoduleByWorkspaceRoute(registry, route, { availableOnly = false } = {}) {
  validateModuleRegistry(registry)
  const matches = registry.flatMap((module) => module.submodules).filter((submodule) => submodule.destination.kind === "workspace" && submodule.destination.route === route)
  if (matches.length > 1) throw new ModuleRegistryError(`Workspace route "${route}" is mapped more than once`, { route })
  const submodule = matches[0] ?? null
  return availableOnly && submodule?.availability !== "available" ? null : submodule
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
