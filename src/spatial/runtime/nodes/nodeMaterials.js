export const NODE_PALETTE = Object.freeze({
  core: Object.freeze({ base: "#15243b", emissive: "#4b7dbd", accent: "#dcecff" }),
  positive: Object.freeze({ base: "#17332f", emissive: "#4b8d7c", accent: "#bfe6dc" }),
  growth: Object.freeze({ base: "#1d2d48", emissive: "#557db7", accent: "#c9dcf5" }),
  stable: Object.freeze({ base: "#202d40", emissive: "#5d789a", accent: "#d4e0ee" }),
  liability: Object.freeze({ base: "#332631", emissive: "#8b647d", accent: "#e4cedb" }),
  outflow: Object.freeze({ base: "#352d29", emissive: "#8d7666", accent: "#ead9cc" }),
  reserve: Object.freeze({ base: "#24332d", emissive: "#688b7a", accent: "#d1e5da" }),
})

export function nodePalette(node) {
  return node.kind === "core" ? NODE_PALETTE.core : NODE_PALETTE[node.tone] || NODE_PALETTE.stable
}
