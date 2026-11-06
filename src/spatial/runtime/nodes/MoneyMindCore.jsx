import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { AdditiveBlending, CanvasTexture, Color, Mesh, SphereGeometry, SpriteMaterial, TorusGeometry } from "three"
import { useMotionEngine } from "../../../motion/core/motionContext"
import { activateNodeIntent, clearHoverIntent, hoverNodeIntent } from "../../../motion/input/motionIntents"
import { resolveNodeMotion } from "../../../motion/nodes/nodeMotion"
import { dampValue } from "../../../motion/performance/animationBudget"
import { NODE_PALETTE, nodeMaterialTier } from "./nodeMaterials"

// Layer 10: the Money Mind Core — the "M" of Money Mind and the origin of the
// universe. A pure visual: its states come from the Layer 3 motion engine
// (resolveNodeMotion core tiers: idle / hovered / selected-module context), its
// idle spin from the motion policy (ambientSpin; FULL only), and what activating
// it means from the node's data (activation: "overview"). No navigation logic.
const HIT_RAYCAST = Mesh.prototype.raycast
const RADIUS = 0.9

function monogramTexture() {
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, size, size)
  ctx.shadowColor = "rgba(196, 180, 255, 0.95)"
  ctx.shadowBlur = 26
  ctx.fillStyle = "#f4f0ff"
  ctx.font = "800 172px 'Plus Jakarta Sans', 'Inter', 'Segoe UI', system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("M", size / 2, size / 2 + 8)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = "srgb"
  return texture
}

function haloTexture() {
  const size = 128
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, "rgba(160, 130, 255, 0.9)")
  gradient.addColorStop(0.45, "rgba(111, 82, 255, 0.35)")
  gradient.addColorStop(1, "rgba(111, 82, 255, 0)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

export default function MoneyMindCore({ detail, index, lighting, node }) {
  const group = useRef(null)
  const shell = useRef(null)
  const material = useRef(null)
  const ringA = useRef(null)
  const ringB = useRef(null)
  const halo = useRef(null)
  const brightness = useRef(1)
  const { activeTransition, dispatchIntent, getTransitionProgress, hoveredId, policy, selectedId } = useMotionEngine()
  const tier = nodeMaterialTier(lighting)
  const palette = NODE_PALETTE.core
  const baseColor = useMemo(() => new Color(palette.base), [palette.base])
  const segments = detail === 1 ? 32 : detail === 2 ? 48 : 64
  const resources = useMemo(() => ({
    sphere: new SphereGeometry(RADIUS, segments, Math.round(segments * 0.75)),
    ringA: new TorusGeometry(1.28, 0.012, 8, segments * 2),
    ringB: new TorusGeometry(1.5, 0.008, 8, segments * 2),
    monogram: new SpriteMaterial({ map: monogramTexture(), transparent: true, depthWrite: false }),
    halo: new SpriteMaterial({ map: haloTexture(), transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.5 }),
  }), [segments])
  useEffect(() => () => {
    resources.sphere.dispose(); resources.ringA.dispose(); resources.ringB.dispose()
    resources.monogram.map.dispose(); resources.monogram.dispose(); resources.halo.map.dispose(); resources.halo.dispose()
  }, [resources])
  useEffect(() => () => { document.body.style.cursor = "" }, [])

  const hovered = hoveredId === node.id
  const selected = selectedId === node.id

  useFrame((state, delta) => {
    if (!group.current || !material.current) return
    const target = resolveNodeMotion({ activeTransition, hovered, hoveredId, index, kind: "core", policy, progress: getTransitionProgress(), revealed: true, selected, selectedId })
    group.current.scale.setScalar(dampValue(group.current.scale.x, target.scale, policy.nodeDamping, delta))
    const breathing = policy.ambientSpin > 0 ? 1 + 0.06 * Math.sin(state.clock.elapsedTime * 0.8) : 1
    material.current.emissiveIntensity = dampValue(material.current.emissiveIntensity, target.emissive * breathing, policy.nodeDamping, delta)
    material.current.opacity = dampValue(material.current.opacity, target.opacity, policy.nodeDamping, delta)
    brightness.current = dampValue(brightness.current, target.brightness, policy.nodeDamping, delta)
    material.current.color.copy(baseColor).multiplyScalar(brightness.current)
    resources.monogram.opacity = material.current.opacity
    if (halo.current) halo.current.material.opacity = 0.5 * material.current.opacity * Math.min(1.4, brightness.current)
    // Calm, organic idle motion — FULL policy only (ambientSpin 0 otherwise).
    const spin = policy.ambientSpin * delta
    if (shell.current) shell.current.rotation.y += spin * 0.5
    if (ringA.current) ringA.current.rotation.z += spin
    if (ringB.current) ringB.current.rotation.z -= spin * 0.6
  })

  const MaterialTag = tier.physical ? "meshPhysicalMaterial" : "meshStandardMaterial"
  const physicalProps = tier.physical ? { clearcoat: tier.clearcoat, clearcoatRoughness: tier.clearcoatRoughness, specularIntensity: tier.specularIntensity } : {}

  return (
    <group position={node.position} ref={group}>
      <sprite material={resources.halo} ref={halo} scale={[3.4, 3.4, 1]} />
      <mesh
        geometry={resources.sphere}
        onClick={(event) => { event.stopPropagation(); dispatchIntent(activateNodeIntent(node)) }}
        onPointerEnter={(event) => {
          event.stopPropagation()
          if (event.pointerType === "touch") return
          dispatchIntent(hoverNodeIntent(node.id))
          document.body.style.cursor = "pointer"
        }}
        onPointerLeave={() => { dispatchIntent(clearHoverIntent()); document.body.style.cursor = "" }}
        raycast={HIT_RAYCAST}
        ref={shell}
      >
        <MaterialTag
          ref={material}
          color={palette.base}
          emissive={palette.emissive}
          emissiveIntensity={0.62}
          metalness={tier.metalness}
          opacity={1}
          roughness={Math.max(0.1, tier.roughness - 0.08)}
          transparent
          {...physicalProps}
        />
      </mesh>
      <sprite material={resources.monogram} position={[0, 0, RADIUS + 0.02]} scale={[0.95, 0.95, 1]} />
      <mesh geometry={resources.ringA} ref={ringA} rotation={[1.18, 0.28, 0]}>
        <meshBasicMaterial color="#b9a8ff" transparent opacity={0.55} />
      </mesh>
      {detail > 1 ? (
        <mesh geometry={resources.ringB} ref={ringB} rotation={[1.92, -0.36, 0.4]}>
          <meshBasicMaterial color="#7fb2ff" transparent opacity={0.35} />
        </mesh>
      ) : null}
    </group>
  )
}
