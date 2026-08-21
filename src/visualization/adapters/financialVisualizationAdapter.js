/**
 * Adapter contract between normalized financial models and renderer-neutral scenes.
 * Concrete adapters must not query Firebase or expose Firestore document objects.
 *
 * @template TFinancialModel
 * @typedef {object} FinancialVisualizationAdapter
 * @property {(model: TFinancialModel) => import("../../spatial/contracts.js").SpatialScene} toScene
 */

/**
 * Validates the minimum renderer-neutral scene shape at the application boundary.
 * @param {unknown} scene
 * @returns {asserts scene is import("../../spatial/contracts.js").SpatialScene}
 */
export function assertSpatialScene(scene) {
  if (!scene || typeof scene !== "object" || !Array.isArray(scene.nodes) || !Array.isArray(scene.edges)) {
    throw new TypeError("A visualization adapter must return a scene with node and edge arrays")
  }
}
