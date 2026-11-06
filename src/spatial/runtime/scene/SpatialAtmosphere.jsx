import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { AdditiveBlending, BufferAttribute, BufferGeometry, PointsMaterial } from "three"
import { useMotionEngine } from "../../../motion/core/motionContext"

// Layer 9 (V2 Spatial Application): a restrained, deterministic depth field of
// faint points behind the scene. Count scales with the quality preset's detail
// (low: 0 — no atmosphere); it drifts only under the FULL motion policy.
const POINTS_BY_DETAIL = Object.freeze({ 1: 0, 2: 260, 3: 520 })
const DRIFT_RADIANS_PER_SECOND = 0.008

// Seeded LCG: the same field on every render and every device.
function seededPositions(count) {
  const positions = new Float32Array(count * 3)
  let seed = 1234567
  const next = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  for (let i = 0; i < count; i += 1) {
    const radius = 7 + next() * 9
    const theta = next() * Math.PI * 2
    const phi = Math.acos(2 * next() - 1)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62
    positions[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 2
  }
  return positions
}

export default function SpatialAtmosphere({ detail }) {
  const points = useRef(null)
  const { policy } = useMotionEngine()
  const count = POINTS_BY_DETAIL[detail] ?? POINTS_BY_DETAIL[2]
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute("position", new BufferAttribute(seededPositions(count), 3))
    return g
  }, [count])
  // Chapter 7 visual-fidelity pass: teal dust (was blue) to match the
  // reference's teal-black atmosphere.
  const material = useMemo(() => new PointsMaterial({ color: "#5eead4", size: 0.045, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, blending: AdditiveBlending }), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (points.current && policy.id === "full") points.current.rotation.y += DRIFT_RADIANS_PER_SECOND * delta
  })

  if (count === 0) return null
  return <points geometry={geometry} material={material} ref={points} />
}
