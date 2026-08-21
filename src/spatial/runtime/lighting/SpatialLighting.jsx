const LIGHTING = Object.freeze({
  basic: { ambient: 0.62, key: 14, rim: 0 },
  standard: { ambient: 0.48, key: 20, rim: 10 },
  enhanced: { ambient: 0.42, key: 24, rim: 14 },
})

export default function SpatialLighting({ mode = "standard" }) {
  const config = LIGHTING[mode] || LIGHTING.standard
  return (
    <>
      <ambientLight intensity={config.ambient} color="#b9c8e6" />
      <pointLight position={[4, 5, 6]} intensity={config.key} color="#d8e7ff" distance={18} />
      {config.rim > 0 ? <pointLight position={[-5, -2, 2]} intensity={config.rim} color="#4d75ad" distance={16} /> : null}
    </>
  )
}
