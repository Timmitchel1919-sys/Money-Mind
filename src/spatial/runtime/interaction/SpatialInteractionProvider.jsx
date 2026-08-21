import { useCallback, useMemo, useState } from "react"
import { SpatialInteractionContext } from "./interactionContext"

export function SpatialInteractionProvider({ children }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const resetSelection = useCallback(() => setSelectedId(null), [])
  const toggleSelection = useCallback((nodeId) => setSelectedId((current) => current === nodeId ? null : nodeId), [])
  const value = useMemo(() => ({ hoveredId, selectedId, setHoveredId, toggleSelection, resetSelection }), [hoveredId, selectedId, resetSelection, toggleSelection])

  return <SpatialInteractionContext.Provider value={value}>{children}</SpatialInteractionContext.Provider>
}
