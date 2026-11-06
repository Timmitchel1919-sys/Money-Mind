import { findSubmodule, findSubmoduleByWorkspaceRoute, validateModuleRegistry } from "../modules/moduleModel.js"

export const APP_ROUTE_KINDS = Object.freeze({ spatial: "spatial", workspace: "workspace" })

const spatialCore = (invalid = false) => Object.freeze({ kind: APP_ROUTE_KINDS.spatial, moduleId: null, submoduleId: null, invalid })
const segment = (value) => encodeURIComponent(value)

export function spatialRoute(moduleId = null, submoduleId = null) {
  if (!moduleId) return "#v2"
  return `#v2/${segment(moduleId)}${submoduleId ? `/${segment(submoduleId)}` : ""}`
}

export function workspaceRoute(submodule) {
  if (submodule?.availability !== "available" || submodule?.destination?.kind !== "workspace") return "#v2"
  return `#workspace/${segment(submodule.destination.route)}/${segment(submodule.parentModuleId)}/${segment(submodule.id)}`
}

export function actionRoute(submodule) {
  if (submodule?.availability !== "available" || submodule?.destination?.kind !== "action") return "#v2"
  return `#workspace/action/${segment(submodule.parentModuleId)}/${segment(submodule.id)}`
}

export function parseAppRoute(hash, registry) {
  validateModuleRegistry(registry)
  let parts
  try {
    parts = String(hash || "").replace(/^#/, "").split("/").filter(Boolean).map(decodeURIComponent)
  } catch {
    return spatialCore(true)
  }
  if (!parts.length || parts[0] === "v2" && parts.length === 1) return spatialCore(false)
  if (parts[0] === "v2") {
    if (parts.length > 3) return spatialCore(true)
    const module = registry.find((candidate) => candidate.id === parts[1])
    if (!module) return spatialCore(true)
    if (!parts[2]) return Object.freeze({ kind: APP_ROUTE_KINDS.spatial, moduleId: module.id, submoduleId: null, invalid: false })
    const submodule = findSubmodule(registry, module.id, parts[2], { availableOnly: true })
    return submodule
      ? Object.freeze({ kind: APP_ROUTE_KINDS.spatial, moduleId: module.id, submoduleId: submodule.id, submodule, invalid: false })
      : spatialCore(true)
  }
  if (parts[0] === "workspace" && parts.length === 4) {
    if (parts[1] === "action") {
      const submodule = findSubmodule(registry, parts[2], parts[3], { availableOnly: true })
      if (!submodule || submodule.destination.kind !== "action") return spatialCore(true)
      const fallbackWorkspace = registry.flatMap((module) => module.submodules).find((candidate) => candidate.id === "overview" && candidate.destination.kind === "workspace")?.destination.route
      if (!fallbackWorkspace) return spatialCore(true)
      return Object.freeze({
        kind: APP_ROUTE_KINDS.workspace,
        workspaceRoute: fallbackWorkspace,
        actionId: submodule.destination.action,
        moduleId: submodule.parentModuleId,
        submoduleId: submodule.id,
        submodule,
        returnHash: spatialRoute(submodule.parentModuleId, submodule.id),
        invalid: false,
      })
    }
    const submodule = findSubmoduleByWorkspaceRoute(registry, parts[1], { availableOnly: true })
    if (!submodule || submodule.parentModuleId !== parts[2] || submodule.id !== parts[3]) return spatialCore(true)
    return Object.freeze({
      kind: APP_ROUTE_KINDS.workspace,
      workspaceRoute: submodule.destination.route,
      moduleId: submodule.parentModuleId,
      submoduleId: submodule.id,
      submodule,
      returnHash: spatialRoute(submodule.parentModuleId, submodule.id),
      invalid: false,
    })
  }
  return spatialCore(true)
}
