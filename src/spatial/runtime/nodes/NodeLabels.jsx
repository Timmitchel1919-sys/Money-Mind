import { useSpatialInteraction } from "../interaction/interactionContext"

function labelPosition(node) {
  if (node.kind === "core") return { "--label-x": 50, "--label-y": 50 }
  return {
    "--label-x": 50 + (node.position[0] / 3.15) * 38,
    "--label-y": 50 - (node.position[1] / 3.15) * 38,
  }
}

export default function NodeLabels({ nodes }) {
  const { hoveredId, selectedId, setHoveredId, toggleSelection } = useSpatialInteraction()

  return (
    <div className="spatial-label-layer" aria-label="Financial domains">
      {nodes.map((node) => {
        const active = selectedId === node.id
        const hovered = hoveredId === node.id
        return (
          <button
            aria-pressed={active}
            className={`spatial-node-label spatial-node-label--${node.kind}${active ? " is-active" : ""}${hovered ? " is-hovered" : ""}`}
            key={node.id}
            onBlur={() => setHoveredId(null)}
            onClick={() => toggleSelection(node.id)}
            onFocus={() => setHoveredId(node.id)}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={labelPosition(node)}
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
