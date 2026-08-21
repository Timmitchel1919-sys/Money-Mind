/** @typedef {"financial"|"navigation"|"context"} SpatialDomain */
/** @typedef {"graph"|"radial"|"timeline"|"flow"|"simulation"} VisualizationMode */
/** @typedef {"auto"|"low"|"medium"|"high"|"ultra"} RenderingQuality */
/** @typedef {"full"|"reduced"|"minimal"|"off"} MotionPreference */

/**
 * @typedef {object} SpatialNode
 * @property {string} id
 * @property {string} label
 * @property {SpatialDomain} domain
 * @property {string=} entityId Reference to normalized application data, never persistence data.
 * @property {[number, number, number]=} position Renderer-neutral world position.
 * @property {"core"|"radial"=} kind
 * @property {string=} detail
 * @property {string=} tone
 */

/**
 * @typedef {object} SpatialEdge
 * @property {string} id
 * @property {string} sourceId
 * @property {string} targetId
 * @property {string=} relationship
 */

/** @typedef {{ id?: string, nodes: SpatialNode[], edges: SpatialEdge[] }} SpatialScene */
/** @typedef {{ nodeId: string|null, edgeId: string|null }} SpatialSelection */
/** @typedef {{ targetId: string|null, zoom: number }} SpatialCameraState */
/** @typedef {{ hoveredId: string|null, selected: SpatialSelection }} SpatialInteractionState */

export const VISUALIZATION_MODES = Object.freeze(["graph", "radial", "timeline", "flow", "simulation"])
export const RENDERING_QUALITIES = Object.freeze(["auto", "low", "medium", "high", "ultra"])
export const MOTION_PREFERENCES = Object.freeze(["full", "reduced", "minimal", "off"])
