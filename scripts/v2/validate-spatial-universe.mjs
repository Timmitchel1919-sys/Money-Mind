// Chapter 7 (Spatial Financial Universe) deterministic checks — plain Node, no
// framework, no browser. Covers the motion-engine hover spotlight rule, the
// palette and the quality-tiered materials. Visual acceptance is browser-based
// (docs/v2/validation/chapter-7-spatial-financial-universe.md).

import { resolveNodeMotion, NODE_SPOTLIGHT } from "../../src/motion/nodes/nodeMotion.js"
import { resolveMotionPolicy } from "../../src/motion/accessibility/motionPolicies.js"
import { NODE_PALETTE, NODE_MATERIAL_TIERS, nodeMaterialTier } from "../../src/spatial/runtime/nodes/nodeMaterials.js"
import { QUALITY_PRESETS } from "../../src/spatial/runtime/quality/qualityPresets.js"

let passed = 0
function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  passed += 1
}

// Scene: core, three domains, one revealed + one hidden child.
const NODES = [
  { id: "core", kind: "core" },
  { id: "income", kind: "radial" },
  { id: "assets", kind: "radial" },
  { id: "debt", kind: "radial" },
  { id: "cash", kind: "child", parentId: "assets" },
  { id: "loan", kind: "child", parentId: "debt" },
]
function frame(policyId, { hoveredId = null, selectedId = null } = {}) {
  const policy = resolveMotionPolicy(policyId)
  return Object.fromEntries(NODES.map((node, index) => {
    const selected = selectedId === node.id
    const revealed = node.kind !== "child" || selectedId === node.parentId || selected
    return [node.id, resolveNodeMotion({ activeTransition: null, hovered: hoveredId === node.id, hoveredId, index, kind: node.kind, policy, progress: 1, revealed, selected, selectedId })]
  }))
}

for (const policy of ["full", "reduced", "minimal", "off"]) {
  const rest = frame(policy)
  // Before hover: everything at normal brightness; core dominant.
  for (const id of ["income", "assets", "debt"]) assert(rest[id].brightness === 1 && rest[id].emissive === NODE_SPOTLIGHT.rest.emissive, `${policy}: ${id} normal at rest`)
  assert(rest.core.brightness === 1 && rest.core.emissive > rest.income.emissive, `${policy}: core dominant at rest`)

  // Hover three different nodes: two domains and a revealed child.
  for (const [hoveredId, selectedId] of [["income", null], ["debt", null], ["cash", "assets"]]) {
    const before = frame(policy, { selectedId })
    const during = frame(policy, { hoveredId, selectedId })
    const after = frame(policy, { selectedId })
    const others = NODES.filter((n) => n.id !== hoveredId && during[n.id].opacity > 0 && n.id !== selectedId).map((n) => n.id)
    assert(during[hoveredId].brightness > before[hoveredId].brightness && during[hoveredId].emissive > before[hoveredId].emissive, `${policy}: hovered ${hoveredId} brighter + more emissive`)
    for (const id of others) {
      assert(during[id].brightness < before[id].brightness && during[id].emissive < before[id].emissive, `${policy}: ${id} dims while ${hoveredId} hovered`)
      assert(during[id].brightness >= 0.4 && during[id].opacity >= Math.min(before[id].opacity, 0.3) && during[id].opacity <= before[id].opacity && during[id].opacity > 0, `${policy}: ${id} dimmed, not hidden/black`)
      assert(during[hoveredId].emissive > during[id].emissive && during[hoveredId].brightness > during[id].brightness, `${policy}: ${hoveredId} outshines ${id}`)
    }
    assert(JSON.stringify(after) === JSON.stringify(before), `${policy}: hover exit restores ${hoveredId} scene exactly`)
    assert(during.loan.opacity === 0 && during.loan.scale === 0.0001, `${policy}: hidden child stays hidden during hover`)
  }

  // Selection vs hover priority (deterministic).
  const sel = frame(policy, { selectedId: "assets" })
  const selHover = frame(policy, { selectedId: "assets", hoveredId: "debt" })
  assert(sel.assets.emissive === NODE_SPOTLIGHT.selected.emissive, `${policy}: selected node highlighted`)
  assert(selHover.debt.emissive > selHover.assets.emissive, `${policy}: hovered outranks selected`)
  assert(selHover.assets.emissive > selHover.income.emissive && selHover.assets.brightness > selHover.income.brightness, `${policy}: selected stays above dimmed nodes`)
  // OFF applies no scale travel by Layer 3 design; there the selection is identified
  // by its tier (above) and the label's aria-pressed.
  if (resolveMotionPolicy(policy).scaleTravel > 0) assert(selHover.assets.scale > selHover.debt.scale, `${policy}: selection keeps its scale emphasis (still identifiable as selected)`)
  assert(selHover.debt.opacity > sel.debt.opacity, `${policy}: a selection-muted node is lifted while hovered`)
  const selfHover = frame(policy, { selectedId: "assets", hoveredId: "assets" })
  assert(selfHover.assets.emissive === NODE_SPOTLIGHT.hovered.emissive, `${policy}: hovering the selected node uses the hover tier`)
  // Core hierarchy: never overpowers the hovered node; above plain dimmed nodes.
  const coreHover = frame(policy, { hoveredId: "income" })
  assert(coreHover.core.emissive < coreHover.income.emissive && coreHover.core.emissive > coreHover.debt.emissive, `${policy}: core below hovered, above dimmed`)
  const hoverCore = frame(policy, { hoveredId: "core" })
  assert(hoverCore.core.emissive === NODE_SPOTLIGHT.hovered.emissive && hoverCore.income.brightness === NODE_SPOTLIGHT.dimmed.brightness, `${policy}: hovering the core spotlights it`)
}
assert(JSON.stringify(frame("full", { hoveredId: "debt" })) === JSON.stringify(frame("full", { hoveredId: "debt" })), "spotlight is deterministic")

// Palette: brighter/bolder than before, distinct per domain, not a rainbow of greys.
const OLD = { core: "#15243b", positive: "#17332f", growth: "#1d2d48", stable: "#202d40", liability: "#332631", outflow: "#352d29", reserve: "#24332d" }
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
const lum = (hex) => { const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const sat = (hex) => { const c = rgb(hex); const max = Math.max(...c); const min = Math.min(...c); return max === 0 ? 0 : (max - min) / max }
const hue = (hex) => { const [r, g, b] = rgb(hex); const max = Math.max(r, g, b); const d = max - Math.min(r, g, b); if (!d) return 0; const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360 }
for (const [tone, colors] of Object.entries(NODE_PALETTE)) {
  assert(lum(colors.base) > lum(OLD[tone]) * 3, `${tone}: base colour substantially brighter than before`)
  assert(sat(colors.base) > sat(OLD[tone]) && sat(colors.base) >= 0.6, `${tone}: bolder (more saturated)`)
}
const tones = Object.keys(NODE_PALETTE)
for (let i = 0; i < tones.length; i++) for (let j = i + 1; j < tones.length; j++) {
  const dh = Math.abs(hue(NODE_PALETTE[tones[i]].base) - hue(NODE_PALETTE[tones[j]].base))
  assert(Math.min(dh, 360 - dh) >= 12, `${tones[i]} vs ${tones[j]}: distinct hues`)
}

// Quality tiers degrade gracefully and map from the existing presets.
assert(QUALITY_PRESETS.low.lighting === "basic" && nodeMaterialTier("basic").physical === false, "low -> basic, plain standard material")
assert(nodeMaterialTier(QUALITY_PRESETS.medium.lighting).physical && nodeMaterialTier(QUALITY_PRESETS.high.lighting).clearcoat > nodeMaterialTier(QUALITY_PRESETS.medium.lighting).clearcoat, "medium < high clearcoat richness")
assert(nodeMaterialTier(QUALITY_PRESETS.ultra.lighting) === NODE_MATERIAL_TIERS.enhanced, "ultra -> enhanced")
assert(nodeMaterialTier("unknown") === NODE_MATERIAL_TIERS.standard, "unknown lighting mode falls back safely")

console.log(`Spatial universe tests: ${passed} assertions passed.`)
