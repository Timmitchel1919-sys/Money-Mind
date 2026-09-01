const PLANES = Object.freeze({
  xy: (cosine, sine, radius) => [cosine * radius, sine * radius, 0],
  xz: (cosine, sine, radius) => [cosine * radius, 0, sine * radius],
  yz: (cosine, sine, radius) => [0, cosine * radius, sine * radius],
})

export function createRadialPositions({ count, radius = 3, startAngle = Math.PI / 2, plane = "xy" }) {
  if (!Number.isInteger(count) || count < 1) return []
  if (!Number.isFinite(radius) || radius <= 0) throw new RangeError("Radial radius must be a positive number")

  const project = PLANES[plane]
  if (!project) throw new RangeError(`Unsupported radial plane: ${plane}`)

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle - (index * Math.PI * 2) / count
    return Object.freeze(project(Math.cos(angle), Math.sin(angle), radius))
  })
}
