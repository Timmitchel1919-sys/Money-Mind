import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useMotionEngine } from "../../motion/core/motionContext"
import { resolveSplineSelection, SPLINE_CORE_OBJECT_ID } from "./splineSelectionAdapter"
import { resolveSplineZoom } from "./splineFraming"
import "./spline-stage.css"

const Spline = lazy(() => import("@splinetool/react-spline"))
const SCENE_URL = "https://prod.spline.design/9rBX2vm0PBZotKW0/scene.splinecode"

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <><p className="spline-fallback-notice" role="status">The Spline scene is unavailable. Using the standard spatial view.</p>{this.props.fallback}</> : this.props.children }
}

function Scene({ children, modules }) {
  const { dispatchIntent, selectedId } = useMotionEngine()
  const stage = useRef(null)
  const runtime = useRef(null)
  const [nativeEventsAvailable, setNativeEventsAvailable] = useState(null)
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
    setNativeEventsAvailable(Object.keys(app.getSplineEvents()).length > 0)
    frameScene()
  }, [frameScene])
  const onMouseDown = useCallback((event) => activate(event.target?.id), [activate])

  return <div ref={stage} className="spatial-stage spatial-stage--app spline-stage" data-testid="spline-stage">
    <Suspense fallback={<p role="status">Loading spatial scene…</p>}>
      <Spline scene={SCENE_URL} onLoad={onLoad} onSplineMouseDown={onMouseDown}><p className="spline-status" role="status">Loading spatial scene…</p></Spline>
    </Suspense>
    <nav className="spline-controls" aria-label="Financial modules">
      <button type="button" onClick={() => activate(SPLINE_CORE_OBJECT_ID)}>Money Mind Core</button>
      {modules.map((module) => <button type="button" key={module.id} disabled={module.availability === "unavailable"} aria-pressed={selectedId === module.id} onClick={() => activate(module.spatial.splineObjectId)}>{module.label}</button>)}
    </nav>
    {import.meta.env.DEV && nativeEventsAvailable === false ? <p className="spline-diagnostic" role="status">Scene has no configured Spline events. Use the module controls.</p> : null}
    {children}
  </div>
}

export default function SplineStage({ children, fallback, modules }) {
  return <SceneBoundary fallback={fallback}><Scene modules={modules}>{children}</Scene></SceneBoundary>
}
