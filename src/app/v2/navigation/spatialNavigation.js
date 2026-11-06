// Layer 12: Core <-> main-module navigation state.
//
// NOT a second state machine: the Layer 3 motion engine already owns selection
// (selectedId), hover (hoveredId), camera focus and reset. Navigation is a pure,
// deterministic view over that state plus the intents that change it.
//
//   level        "core" (overview) | "module" (a main module is the active context)
//   activePath   [coreId] or [coreId, moduleId] — the only path that gets maximum
//                emphasis; later layers extend it with submodule / information ids.
import { resetViewIntent, selectNodeIntent } from "../../../motion/input/motionIntents.js"

export const NAVIGATION_LEVELS = Object.freeze({ core: "core", module: "module", submodule: "submodule" })

export function deriveSpatialNavigation({ coreId, hoveredId = null, modules = [], selectedId = null, selectedSubmoduleId = null }) {
  const activeModule = modules.find((module) => module.id === selectedId) ?? null
  const hoveredModule = modules.find((module) => module.id === hoveredId) ?? null
  const activeSubmodule = activeModule?.submodules.find((submodule) => submodule.id === selectedSubmoduleId) ?? null
  return Object.freeze({
    level: activeSubmodule ? NAVIGATION_LEVELS.submodule : activeModule ? NAVIGATION_LEVELS.module : NAVIGATION_LEVELS.core,
    activeModuleId: activeModule?.id ?? null,
    activeModule,
    activeSubmodule,
    activeSubmoduleId: activeSubmodule?.id ?? null,
    previewModuleId: hoveredModule && hoveredModule.id !== activeModule?.id ? hoveredModule.id : null,
    activePath: Object.freeze(activeSubmodule ? [coreId, activeModule.id, activeSubmodule.id] : activeModule ? [coreId, activeModule.id] : [coreId]),
    canReturn: Boolean(activeModule),
  })
}

/** Neighbouring module in reading order, wrapping around (keyboard / prev-next). */
export function adjacentModuleId(modules, currentId, direction) {
  if (!modules.length) return null
  const index = modules.findIndex((module) => module.id === currentId)
  if (index === -1) return modules[direction < 0 ? modules.length - 1 : 0].id
  return modules[(index + (direction < 0 ? -1 : 1) + modules.length) % modules.length].id
}

export const openModuleIntent = (moduleId) => selectNodeIntent(moduleId)
export const returnToCoreIntent = () => resetViewIntent()

export function resolveSubmodule(modules, moduleId, submoduleId) {
  const module = modules.find((candidate) => candidate.id === moduleId)
  return module?.submodules.find((submodule) => submodule.id === submoduleId && submodule.availability === "available") ?? null
}

export function orderedSubmodules(module) {
  return (module?.submodules ?? []).slice().sort((a, b) => a.navigation.order - b.navigation.order || a.id.localeCompare(b.id))
}
