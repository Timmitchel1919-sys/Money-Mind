export function dampValue(current, target, damping, delta) {
  if (damping === Infinity) return target
  return current + (target - current) * (1 - Math.exp(-damping * delta))
}
