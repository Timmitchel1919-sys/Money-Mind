import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { resolveMotionPolicy } from "../accessibility/motionPolicies.js"
import { MOTION_INTENTS } from "../input/motionIntents.js"
import { resolveResetSequence, resolveSelectionSequence } from "../orchestration/transitionSequences.js"
import { SCENE_STATES, TRANSITIONS, transitionProgress } from "./motionState.js"
import { MotionContext } from "./motionContext.js"

let transitionId = 0
const createTransition = (name, duration, targetNodeId = null) => Object.freeze({ id: ++transitionId, name, duration, targetNodeId, startedAt: performance.now() })

export function MotionProvider({ children, motionPreference }) {
  const policy = useMemo(() => resolveMotionPolicy(motionPreference), [motionPreference])
  const entryTransition = useMemo(() => createTransition(TRANSITIONS.entry, policy.durations.entry), [policy])
  const [sceneState, setSceneState] = useState(SCENE_STATES.overview)
  const [selectedId, setSelectedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [activeTransition, setActiveTransition] = useState(entryTransition)
  const sceneStateRef = useRef(sceneState)
  const selectedIdRef = useRef(selectedId)
  const activeTransitionRef = useRef(activeTransition)
  const settlementTimerRef = useRef(null)

  const settleTransition = useCallback((settledState, transition) => {
    if (activeTransitionRef.current?.id !== transition.id) return
    sceneStateRef.current = settledState
    activeTransitionRef.current = null
    setSceneState(settledState)
    setActiveTransition(null)
  }, [])

  const startSequence = useCallback((sequence) => {
    if (settlementTimerRef.current) clearTimeout(settlementTimerRef.current)
    const transition = createTransition(sequence.name, sequence.duration, sequence.selectedId)
    sceneStateRef.current = sequence.phase
    selectedIdRef.current = sequence.selectedId
    activeTransitionRef.current = transition
    setHoveredId(null)
    setSelectedId(sequence.selectedId)
    setSceneState(sequence.phase)
    setActiveTransition(transition)
    if (sequence.duration === 0) return settleTransition(sequence.settled, transition)
    settlementTimerRef.current = setTimeout(() => settleTransition(sequence.settled, transition), sequence.duration)
  }, [settleTransition])

  useEffect(() => {
    activeTransitionRef.current = entryTransition
    if (entryTransition.duration === 0) {
      activeTransitionRef.current = null
      setActiveTransition(null)
      return undefined
    }
    settlementTimerRef.current = setTimeout(() => settleTransition(SCENE_STATES.overview, entryTransition), entryTransition.duration)
    return () => { if (settlementTimerRef.current) clearTimeout(settlementTimerRef.current) }
  }, [entryTransition, settleTransition])

  const dispatchIntent = useCallback((intent) => {
    if (intent.type === MOTION_INTENTS.selectNode) return startSequence(resolveSelectionSequence({ currentSelectedId: selectedIdRef.current, nodeId: intent.nodeId, policy }))
    if (intent.type === MOTION_INTENTS.resetView) {
      if (!selectedIdRef.current && sceneStateRef.current === SCENE_STATES.overview) return
      return startSequence(resolveResetSequence(policy))
    }
    if (intent.type === MOTION_INTENTS.hoverNode) {
      setHoveredId(intent.nodeId)
      if (!selectedIdRef.current && sceneStateRef.current === SCENE_STATES.overview) {
        sceneStateRef.current = SCENE_STATES.hovering
        setSceneState(SCENE_STATES.hovering)
      }
      return
    }
    if (intent.type === MOTION_INTENTS.clearHover) {
      setHoveredId(null)
      if (sceneStateRef.current === SCENE_STATES.hovering) {
        sceneStateRef.current = SCENE_STATES.overview
        setSceneState(SCENE_STATES.overview)
      }
    }
  }, [policy, startSequence])

  const getTransitionProgress = useCallback(() => transitionProgress(activeTransitionRef.current), [])
  const value = useMemo(() => ({ activeTransition, dispatchIntent, getTransitionProgress, hoveredId, motionPreference: policy.id, policy, sceneState, selectedId }), [activeTransition, dispatchIntent, getTransitionProgress, hoveredId, policy, sceneState, selectedId])
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}
