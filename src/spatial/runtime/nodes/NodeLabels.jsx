import { useMotionEngine } from "../../../motion/core/motionContext"
import { TRANSITIONS } from "../../../motion/core/motionState"
import { clearHoverIntent, hoverNodeIntent, selectNodeIntent } from "../../../motion/input/motionIntents"

function labelPosition(node) {
  if (node.kind === "core") return { "--label-x": 50, "--label-y": 50 }
  return {
    "--label-x": 50 + (node.position[0] / 3.15) * 38,
    "--label-y": 50 - (node.position[1] / 3.15) * 38,
  }
}

export default function NodeLabels({ nodes }) {
  const { activeTransition, dispatchIntent, hoveredId, policy, selectedId } = useMotionEngine()

  return (
    <div className="spatial-label-layer" aria-label="Financial domains">
      {nodes.map((node) => {
        const active = selectedId === node.id
        const hovered = hoveredId === node.id
        return (
          <button
            aria-pressed={active}
            className={`spatial-node-label spatial-node-label--${node.kind}${active ? " is-active" : ""}${hovered ? " is-hovered" : ""}${selectedId && !active && node.kind !== "core" ? " is-muted" : ""}${activeTransition?.name === TRANSITIONS.entry ? " is-entering" : ""}`}
            key={node.id}
            onBlur={() => dispatchIntent(clearHoverIntent())}
            onClick={() => dispatchIntent(selectNodeIntent(node.id))}
            onFocus={() => dispatchIntent(hoverNodeIntent(node.id))}
            onMouseEnter={() => dispatchIntent(hoverNodeIntent(node.id))}
            onMouseLeave={() => dispatchIntent(clearHoverIntent())}
            style={{ ...labelPosition(node), "--motion-entry-delay": `${node.kind === "core" ? 0 : nodes.indexOf(node) * policy.stagger}ms`, "--motion-entry-duration": `${activeTransition?.duration || 0}ms` }}
            type="button"
          >
            <span>{node.label}</span>
            {node.detail ? <small>{node.detail}</small> : null}
          </button>
        )
      })}
    </div>
  )
}
