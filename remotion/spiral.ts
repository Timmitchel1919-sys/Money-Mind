export type SpiralPoint = { x: number; y: number };

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Deterministic point list for a spiral that grows outward and then locks
 * into one full closed revolution at `maxRadius` — the tail reads as a
 * solid ring while the inner arm reads as a decorative chrome swirl
 * feeding into it.
 */
export function buildSpiralRingPoints(opts: {
  count?: number;
  turns?: number;
  maxRadius: number;
  spiralFraction?: number;
}): SpiralPoint[] {
  const { count = 320, turns = 3.2, maxRadius, spiralFraction = 0.78 } = opts;
  const points: SpiralPoint[] = [];

  for (let i = 0; i < count; i++) {
    const s = i / (count - 1);
    let angle: number;
    let radius: number;

    if (s <= spiralFraction) {
      const su = s / spiralFraction;
      angle = su * turns * Math.PI * 2;
      radius = maxRadius * easeInOutCubic(su);
    } else {
      const sr = (s - spiralFraction) / (1 - spiralFraction);
      angle = turns * Math.PI * 2 + sr * Math.PI * 2;
      radius = maxRadius;
    }

    points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  }

  return points;
}

export function pointsToPath(points: SpiralPoint[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}
