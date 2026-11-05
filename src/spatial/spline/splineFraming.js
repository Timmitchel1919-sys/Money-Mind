// The export is wider than it is tall. Narrow viewports need a smaller zoom
// to keep the core and module branch visible. Invalid sizes are ignored.
export function resolveSplineZoom(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  return Math.min(1, Math.max(0.25, (width / height) * 0.78))
}
