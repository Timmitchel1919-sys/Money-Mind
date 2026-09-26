import { Sparkles } from "lucide-react"
import { openMoneyAIFromSpatial } from "./moneyAISpatialBridge"

function questionForSelection(selectedNode) {
  if (!selectedNode) return "What is the most important action I can take with my finances right now?"
  return `What should I focus on about my ${selectedNode.label.toLowerCase()}?`
}

/**
 * Renderer-adjacent AI entry point. It only describes the current scene
 * selection and hands the request to the existing Money AI experience.
 */
export default function SpatialAIConsole({ selectedNode }) {
  const question = questionForSelection(selectedNode)

  return (
    <aside className="spatial-ai-console" aria-label="Money AI scene assistant">
      <div>
        <span className="spatial-ai-console__eyebrow"><Sparkles size={12} aria-hidden="true" /> Money AI</span>
        <strong>{selectedNode ? `${selectedNode.label} in focus` : "Your financial scene"}</strong>
        <p>{selectedNode ? "Ask Money AI for guidance about this financial area." : "Ask Money AI to identify your most useful next financial step."}</p>
      </div>
      <button className="spatial-control spatial-ai-console__action" type="button" onClick={() => openMoneyAIFromSpatial(question)}>
        Ask Money AI
      </button>
    </aside>
  )
}
