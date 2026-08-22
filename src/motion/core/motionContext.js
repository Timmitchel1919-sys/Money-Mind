import { createContext, useContext } from "react"

export const MotionContext = createContext(null)

export function useMotionEngine() {
  const context = useContext(MotionContext)
  if (!context) throw new Error("Motion hooks require MotionProvider")
  return context
}
