export const MOTION_INTENTS = Object.freeze({ hoverNode: "HOVER_NODE", clearHover: "CLEAR_HOVER", selectNode: "SELECT_NODE", resetView: "RESET_VIEW" })
export const hoverNodeIntent = (nodeId) => Object.freeze({ type: MOTION_INTENTS.hoverNode, nodeId })
export const clearHoverIntent = () => Object.freeze({ type: MOTION_INTENTS.clearHover })
export const selectNodeIntent = (nodeId) => Object.freeze({ type: MOTION_INTENTS.selectNode, nodeId })
export const resetViewIntent = () => Object.freeze({ type: MOTION_INTENTS.resetView })

// Layer 10: what activating (click / Enter / Space) a node means is data on the
// node, not code in the mesh. `activation: "overview"` (the Money Mind Core)
// returns to the overview; every other node is selected as before.
export const activateNodeIntent = (node) => (node?.activation === "overview" ? resetViewIntent() : selectNodeIntent(node.id))
