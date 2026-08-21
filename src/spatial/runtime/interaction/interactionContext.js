import { createContext, useContext } from "react"

export const SpatialInteractionContext = createContext(null)

export function useSpatialInteraction() {
  const context = useContext(SpatialInteractionContext)
  if (!context) throw new Error("Spatial interaction hooks require SpatialInteractionProvider")
  return context
}
