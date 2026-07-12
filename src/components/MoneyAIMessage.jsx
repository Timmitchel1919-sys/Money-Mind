import { Copy, Volume2, RotateCcw } from "lucide-react"

function formatTime(timestamp) {
  if (!timestamp) return ""
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function MoneyAIMessage({ message, onCopy, onPlay, onRetry, showRetry }) {
  const isUser = message.role === "user"

  return (
    <div
      className={`flex max-w-[85%] flex-col rounded-2xl border p-4 ${
        isUser ? "self-end border-[#BFC4CC]/20 bg-black/30" : "self-start border-[#8B5CF6]/25 bg-[#1F242D]/60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#A5ADB8]">
          {isUser ? "You" : "Money AI"}
        </span>
        <span className="text-xs text-[#707680]">{formatTime(message.timestamp)}</span>
      </div>

      <p className="mt-2 min-w-0 whitespace-pre-line break-words text-[#D5D8DD]">{message.text}</p>

      {message.disclaimer && <p className="mt-3 text-xs text-[#A5ADB8]">{message.disclaimer}</p>}
      {message.providerNote && <p className="mt-2 text-xs text-[#FBBF24]">{message.providerNote}</p>}

      {!isUser && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onCopy?.(message.text)}
            className="flex items-center gap-1 text-xs text-[#A5ADB8] transition hover:text-white"
          >
            <Copy size={14} /> Copy
          </button>

          <button
            type="button"
            onClick={() => onPlay?.(message.text, message.language)}
            className="flex items-center gap-1 text-xs text-[#A5ADB8] transition hover:text-white"
          >
            <Volume2 size={14} /> Play
          </button>

          {showRetry && (
            <button
              type="button"
              onClick={() => onRetry?.()}
              className="flex items-center gap-1 text-xs text-[#A5ADB8] transition hover:text-white"
            >
              <RotateCcw size={14} /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}
