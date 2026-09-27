// Layers 8–12 (V2 Spatial Application) deterministic checks — plain Node, no
// framework, no browser. Browser acceptance: docs/v2/validation/layers-8-12-v2-spatial-application.md

import { PRESENTATIONS, resolvePresentation } from "../../src/app/presentation/resolvePresentation.js"
import { readClassicViewPreference, writeClassicViewPreference } from "../../src/app/presentation/classicViewPreference.js"
import { activateNodeIntent, MOTION_INTENTS } from "../../src/motion/input/motionIntents.js"
import { resolveMotionPolicy } from "../../src/motion/accessibility/motionPolicies.js"
import { resolveNodeMotion } from "../../src/motion/nodes/nodeMotion.js"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { MODULE_REGISTRY } from "../../src/app/v2/modules/moduleRegistry.js"
import { ModuleRegistryError, resolveVisibleModules, validateModuleRegistry } from "../../src/app/v2/modules/moduleModel.js"
import { createModuleSpatialScene, MODULE_LAYOUT, MONEY_MIND_CORE_ID } from "../../src/visualization/adapters/moduleSpatialAdapter.js"
import { SEARCHABLE_NAVIGATION } from "../../src/constants/navigation.js"
import { NODE_PALETTE } from "../../src/spatial/runtime/nodes/nodeMaterials.js"
import { adjacentModuleId, deriveSpatialNavigation, NAVIGATION_LEVELS, openModuleIntent, returnToCoreIntent } from "../../src/app/v2/navigation/spatialNavigation.js"
import { resolveEdgeMotion } from "../../src/motion/edges/edgeMotion.js"

let passed = 0
function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  passed += 1
}

// --- Layer 8: presentation boundary ---
{
  const P = PRESENTATIONS
  const cases = [
    [{}, P.public],
    [{ signedIn: false, v2AppShell: true }, P.public],
    [{ signedIn: false, locked: true, v2AppShell: true }, P.public],
    [{ signedIn: true }, P.legacy],
    [{ signedIn: true, v2AppShell: false, classicRequested: true }, P.legacy],
    [{ signedIn: true, v2AppShell: true }, P.v2],
    [{ signedIn: true, v2AppShell: true, classicRequested: true }, P.legacy],
    [{ signedIn: true, locked: true, v2AppShell: true }, P.locked],
    [{ signedIn: true, locked: true, v2AppShell: true, classicRequested: true }, P.locked],
    [{ signedIn: true, locked: true }, P.locked],
  ]
  for (const [input, expected] of cases) assert(resolvePresentation(input) === expected, `presentation ${JSON.stringify(input)} -> ${expected}`)
  assert(Object.isFrozen(PRESENTATIONS), "presentations are a frozen set")

  const store = new Map()
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
  assert(readClassicViewPreference(storage) === false, "no preference -> V2")
  writeClassicViewPreference(true, storage)
  assert(readClassicViewPreference(storage) === true, "classic stored for the session")
  writeClassicViewPreference(false, storage)
  assert(readClassicViewPreference(storage) === false && !store.size, "returning to V2 clears the preference")
  const broken = { getItem() { throw new Error("blocked") }, setItem() { throw new Error("blocked") }, removeItem() { throw new Error("blocked") } }
  assert(readClassicViewPreference(broken) === false, "blocked storage falls back to V2")
  writeClassicViewPreference(true, broken)
  assert(true, "blocked storage write does not throw")
}

// --- Layer 10: Money Mind Core ---
{
  const core = { id: "money-mind-core", kind: "core", activation: "overview" }
  assert(activateNodeIntent(core).type === MOTION_INTENTS.resetView, "activating the Core returns to overview (data-driven)")
  assert(activateNodeIntent({ id: "income" }).type === MOTION_INTENTS.selectNode && activateNodeIntent({ id: "income" }).nodeId === "income", "other nodes are selected as before")
  assert(resolveMotionPolicy("full").ambientSpin > 0, "FULL: calm idle spin")
  for (const p of ["reduced", "minimal", "off"]) assert(resolveMotionPolicy(p).ambientSpin === 0, `${p}: Core stays still`)
  assert(resolveMotionPolicy("full").ambientSpin < 0.3, "idle spin is slow (< 0.3 rad/s)")
  const coreState = (extra) => resolveNodeMotion({ activeTransition: null, index: 0, kind: "core", policy: resolveMotionPolicy("full"), progress: 1, revealed: true, hovered: false, selected: false, selectedId: null, hoveredId: null, ...extra })
  const idle = coreState({})
  const hovered = coreState({ hovered: true, hoveredId: core.id })
  const moduleContext = coreState({ selectedId: "wealth-building" })
  const moduleHovered = coreState({ hoveredId: "dashboard" })
  assert(hovered.emissive > idle.emissive && hovered.brightness > idle.brightness, "Core hover/focus state is brighter than idle")
  assert(moduleContext.opacity < idle.opacity && moduleContext.opacity >= 0.7 && moduleContext.scale < idle.scale && moduleContext.scale > 0.6 * idle.scale, "with a module selected the Core recedes slightly but stays prominent")
  assert(moduleHovered.opacity > 0.5 && moduleHovered.emissive > 0, "Core stays visible while a module is hovered")
}

// --- Layer 11: module registry + spatial adapter ---
function throwsRegistry(fn, label) {
  try { fn() } catch (error) { assert(error instanceof ModuleRegistryError, `${label} (ModuleRegistryError)`); return }
  throw new Error(`FAIL: ${label} (expected a throw)`)
}
{
  validateModuleRegistry(MODULE_REGISTRY)
  const modules = resolveVisibleModules(MODULE_REGISTRY)
  assert(JSON.stringify(modules.map((m) => m.label)) === JSON.stringify(["Dashboard", "Money Movement", "Wealth Building", "Intelligence", "Settings"]), "five initial modules in reading order")
  assert(Object.isFrozen(MODULE_REGISTRY) && MODULE_REGISTRY.every((m) => Object.isFrozen(m) && Object.isFrozen(m.submodules)), "registry is immutable")
  const legacyPages = new Set(SEARCHABLE_NAVIGATION.map((item) => item.value))
  for (const module of modules) {
    assert(Boolean(NODE_PALETTE[module.tone]), `${module.id}: tone "${module.tone}" exists in the runtime palette`)
    for (const sub of module.submodules) assert(legacyPages.has(sub.legacyPage), `${module.id}/${sub.id}: legacy page "${sub.legacyPage}" exists in V1`)
  }
  const covered = new Set(modules.flatMap((m) => m.submodules.map((s) => s.legacyPage)))
  for (const page of legacyPages) assert(covered.has(page), `V1 screen "${page}" has a home in the module registry`)

  // Adapter
  const scene = createModuleSpatialScene({ modules, core: { detail: "SRD 5,000.00" } })
  const core = scene.nodes[0]
  assert(core.id === MONEY_MIND_CORE_ID && core.visual === "money-mind-core" && core.activation === "overview" && core.detail === "SRD 5,000.00", "Core node: Money Mind visual, overview activation, app-provided detail")
  assert(scene.nodes.filter((n) => n.kind === "radial").length === 5 && scene.edges.length === 5, "5 module nodes, 5 Core -> module links")
  assert(scene.edges.every((e) => e.sourceId === MONEY_MIND_CORE_ID && scene.nodes.some((n) => n.id === e.targetId)), "every link starts at the Core and ends at a module (no dangling)")
  const pos = (id) => scene.nodes.find((n) => n.id === id).position
  const angle = (id) => (Math.atan2(pos(id)[1], pos(id)[0]) * 180) / Math.PI
  assert(Math.abs(pos("dashboard")[0]) < 1e-9 && pos("dashboard")[1] > 3, "Dashboard at the top")
  assert(pos("money-movement")[0] > 0 && pos("money-movement")[1] > 0, "Money Movement upper right")
  assert(pos("wealth-building")[0] > 0 && pos("wealth-building")[1] < 0, "Wealth Building lower right")
  assert(pos("settings")[0] < 0 && pos("settings")[1] < 0, "Settings lower left")
  assert(pos("intelligence")[0] < 0 && pos("intelligence")[1] > 0, "Intelligence upper left")
  assert(scene.nodes.slice(1).every((n) => Math.abs(Math.hypot(n.position[0], n.position[1]) - MODULE_LAYOUT.radius) < 1e-9), "all modules on the configured ring")
  assert(Number.isFinite(angle("dashboard")), "positions are finite")
  assert(JSON.stringify(createModuleSpatialScene({ modules, core: { detail: "SRD 5,000.00" } })) === JSON.stringify(scene), "adapter is deterministic")
  assert(Object.isFrozen(scene) && scene.nodes.every(Object.isFrozen), "scene is immutable")
  assert(scene.nodes.slice(1).every((n) => !("amount" in n)), "module nodes carry no financial values")

  // Extensibility: a sixth module is data only.
  const extended = [...MODULE_REGISTRY, { id: "goals-lab", label: "Goals Lab", description: "Future module.", tagline: "Plan", icon: "Target", tone: "reserve", order: 6, spatial: { slot: 5 }, permissions: ["authenticated"], featureFlag: "v2GoalsLab", submodules: [] }]
  assert(resolveVisibleModules(extended, { flags: {} }).length === 5, "feature-flagged module hidden while its flag is off")
  const six = resolveVisibleModules(extended, { flags: { v2GoalsLab: true } })
  const sixScene = createModuleSpatialScene({ modules: six })
  assert(six.length === 6 && sixScene.nodes.length === 7 && sixScene.edges.length === 6, "a sixth module appears from registry data alone")
  assert(resolveVisibleModules([...MODULE_REGISTRY.slice(0, 4), { ...MODULE_REGISTRY[4], permissions: ["admin"] }]).length === 4, "permission-gated module hidden without the capability")

  // Invalid registries are rejected, not repaired.
  throwsRegistry(() => validateModuleRegistry([...MODULE_REGISTRY, { ...MODULE_REGISTRY[0] }]), "duplicate id")
  throwsRegistry(() => validateModuleRegistry([MODULE_REGISTRY[0], { ...MODULE_REGISTRY[1], spatial: { slot: 0 } }]), "duplicate slot")
  throwsRegistry(() => validateModuleRegistry([{ ...MODULE_REGISTRY[0], label: "" }]), "missing label")
  throwsRegistry(() => validateModuleRegistry([{ ...MODULE_REGISTRY[0], id: "Bad Id" }]), "malformed id")
  throwsRegistry(() => validateModuleRegistry([{ ...MODULE_REGISTRY[0], submodules: [{ id: "x", label: "X" }, { id: "x", label: "Y" }] }]), "duplicate submodule")
  throwsRegistry(() => validateModuleRegistry("nope"), "non-array registry")

  // No hardcoded module branching outside the registry.
  const files = []
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = `${dir}/${f}`
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.(js|jsx)$/.test(f)) files.push(p)
    }
  }
  for (const dir of ["src/app/v2", "src/spatial", "src/motion", "src/visualization"]) walk(fileURLToPath(new URL(`../../${dir}`, import.meta.url)))
  for (const file of files.filter((f) => !f.endsWith("moduleRegistry.js"))) {
    const code = readFileSync(file, "utf8").replace(/\/\/.*$/gm, "")
    assert(!/["'](money-movement|wealth-building|intelligence|dashboard)["']/.test(code), `${file.split("/src/")[1]}: no hardcoded module ids`)
  }
}

// --- Layer 12: Core <-> module navigation ---
{
  const modules = resolveVisibleModules(MODULE_REGISTRY)
  const ids = modules.map((m) => m.id)
  const core = MONEY_MIND_CORE_ID
  const idle = deriveSpatialNavigation({ coreId: core, modules })
  assert(idle.level === NAVIGATION_LEVELS.core && idle.activeModuleId === null && JSON.stringify(idle.activePath) === JSON.stringify([core]) && !idle.canReturn, "idle: Core overview")
  const hover = deriveSpatialNavigation({ coreId: core, modules, hoveredId: ids[1] })
  assert(hover.level === "core" && hover.previewModuleId === ids[1], "hover previews without navigating")
  const selected = deriveSpatialNavigation({ coreId: core, modules, selectedId: ids[2], hoveredId: ids[2] })
  assert(selected.level === "module" && selected.activeModuleId === ids[2] && selected.previewModuleId === null && selected.canReturn, "selected module is the active context")
  assert(JSON.stringify(selected.activePath) === JSON.stringify([core, ids[2]]), "active path = Core -> module")
  assert(deriveSpatialNavigation({ coreId: core, modules, selectedId: ids[2], hoveredId: ids[0] }).previewModuleId === ids[0], "hovering another module while one is active previews it")
  assert(deriveSpatialNavigation({ coreId: core, modules, selectedId: "not-a-module" }).level === "core", "unknown selection stays at the Core")
  assert(deriveSpatialNavigation({ coreId: core, modules, selectedId: core }).level === "core", "Core selection = Core level")
  assert(Object.isFrozen(selected) && Object.isFrozen(selected.activePath), "navigation state is immutable")
  assert(JSON.stringify(deriveSpatialNavigation({ coreId: core, modules, selectedId: ids[3] })) === JSON.stringify(deriveSpatialNavigation({ coreId: core, modules, selectedId: ids[3] })), "deterministic")
  // neighbours wrap in reading order
  assert(adjacentModuleId(modules, ids[0], 1) === ids[1] && adjacentModuleId(modules, ids[0], -1) === ids[ids.length - 1] && adjacentModuleId(modules, ids[ids.length - 1], 1) === ids[0], "prev/next wrap around")
  assert(adjacentModuleId(modules, null, 1) === ids[0] && adjacentModuleId([], null, 1) === null, "no current module / no modules")
  // intents are the existing motion intents (single state machine)
  assert(openModuleIntent(ids[1]).type === MOTION_INTENTS.selectNode && openModuleIntent(ids[1]).nodeId === ids[1], "open module = select intent")
  assert(returnToCoreIntent().type === MOTION_INTENTS.resetView, "return = reset intent")
  // active-light: selected Core->module link strongest, other links recede but stay visible
  const policy = resolveMotionPolicy("full")
  const link = (connected, active) => resolveEdgeMotion({ active, activeTransition: null, connectedToSelection: connected, policy, progress: 1, selectedId: ids[2] })
  const idleLink = resolveEdgeMotion({ active: false, activeTransition: null, connectedToSelection: false, policy, progress: 1, selectedId: null })
  const hoverLink = resolveEdgeMotion({ active: true, activeTransition: null, connectedToSelection: false, policy, progress: 1, selectedId: null })
  assert(link(true, true).opacity > hoverLink.opacity && hoverLink.opacity > idleLink.opacity && idleLink.opacity > link(false, false).opacity && link(false, false).opacity > 0, "link emphasis: selected path > hovered > idle > other links (still visible)")
  // Settings shortcut is registry data
  assert(modules.filter((m) => m.shortcut === "settings").length === 1, "exactly one module owns the topbar Settings shortcut")
  // Module selection keeps other modules visible (Chapter 7 tiers + Layer 3 mute)
  const others = resolveNodeMotion({ activeTransition: null, index: 2, kind: "radial", policy, progress: 1, revealed: true, hovered: false, selected: false, selectedId: ids[2], hoveredId: null })
  const chosen = resolveNodeMotion({ activeTransition: null, index: 3, kind: "radial", policy, progress: 1, revealed: true, hovered: false, selected: true, selectedId: ids[2], hoveredId: null })
  assert(others.opacity > 0 && others.opacity < chosen.opacity && chosen.scale > others.scale && chosen.emissive > others.emissive, "selected module brighter/larger; others dimmed but visible")
}

console.log(`V2 application tests: ${passed} assertions passed.`)
