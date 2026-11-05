import { Component, lazy, Suspense, useCallback, useEffect, useRef } from "react"
import { useMotionEngine } from "../../motion/core/motionContext"
import { resolveSplineSelection, SPLINE_CORE_OBJECT_ID } from "./splineSelectionAdapter"
import { resolveSplineZoom } from "./splineFraming"
import "./spline-stage.css"

const Spline = lazy(() => import("@splinetool/react-spline"))
const SCENE_URL = "https://prod.spline.design/9rBX2vm0PBZotKW0/scene.splinecode"

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function Scene({ children, modules }) {
  const { dispatchIntent, selectedId } = useMotionEngine()
  const stage = useRef(null)
  const runtime = useRef(null)
  // react-spline registers event listeners on load; ref keeps its callback fresh.
  const current = useRef({ dispatchIntent, modules })
  current.current = { dispatchIntent, modules }
  const activate = useCallback((objectId) => {
    const intent = resolveSplineSelection(objectId, current.current.modules)
    if (intent) current.current.dispatchIntent(intent)
  }, [])
  const frameScene = useCallback(() => {
    if (!runtime.current || !stage.current) return
    const { width, height } = stage.current.getBoundingClientRect()
    const zoom = resolveSplineZoom(width, height)
    if (zoom !== null) runtime.current.setZoom(zoom)
  }, [])
  useEffect(() => {
    const observer = new ResizeObserver(frameScene)
    if (stage.current) observer.observe(stage.current)
    return () => { observer.disconnect(); runtime.current = null }
  }, [frameScene])
  const onLoad = useCallback((app) => {
    const requiredIds = [SPLINE_CORE_OBJECT_ID, ...current.current.modules.map((module) => module.spatial.splineObjectId)]
    if (requiredIds.some((id) => !id || !app.findObjectById(id))) throw new Error("Spline scene is missing a registered object")
    runtime.current = app
    frameScene()
  }, [frameScene])
  const onMouseDown = useCallback((event) => activate(event.target?.id), [activate])

  return <div ref={stage} className="spatial-stage spatial-stage--app spline-stage" data-testid="spline-stage">
    <Suspense fallback={<p role="status">Loading spatial scene…</p>}>
      <Spline scene={SCENE_URL} onLoad={onLoad} onSplineMouseDown={onMouseDown} />
    </Suspense>
    <nav className="spline-controls" aria-label="Financial modules">
      <button type="button" onClick={() => activate(SPLINE_CORE_OBJECT_ID)}>Money Mind Core</button>
      {modules.map((module) => <button type="button" key={module.id} aria-pressed={selectedId === module.id} onClick={() => activate(module.spatial.splineObjectId)}>{module.label}</button>)}
    </nav>
    {children}
  </div>
}

export default function SplineStage({ children, fallback, modules }) {
  return <SceneBoundary fallback={fallback}><Scene modules={modules}>{children}</Scene></SceneBoundary>
}
