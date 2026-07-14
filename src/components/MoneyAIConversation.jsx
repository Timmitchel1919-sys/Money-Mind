import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import MoneyAIMessage from "./MoneyAIMessage"
import MoneyAIQuickActions from "./MoneyAIQuickActions"
import MoneyAIAvatar from "./MoneyAIAvatar"

const NEAR_BOTTOM_THRESHOLD_PX = 120

// The one scrollable region inside the Money AI chat shell. Auto-scrolls
// to the newest message only while the user is already near the bottom —
// if they've deliberately scrolled up to re-read something, new messages
// don't yank them back down; a "Jump to latest" button appears instead.
export default function MoneyAIConversation({
  messages,
  isProcessing,
  error,
  onCopy,
  onPlay,
  onRetry,
  onSuggestedQuestion,
  language = "en",
  t,
}) {
  const containerRef = useRef(null)
  const bottomRef = useRef(null)
  const [isNearBottom, setIsNearBottom] = useState(true)

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setIsNearBottom(distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX)
  }

  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isProcessing])

  function scrollToLatest() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    setIsNearBottom(true)
  }

  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant")

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="scrollbar-transparent h-full overflow-y-auto px-4 py-6 md:px-6"
        aria-live="polite"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-10 text-center">
              <MoneyAIAvatar size={64} />

              <div>
                <h2 className="text-xl font-semibold text-[#FAFAFA]">{t.title}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#A5ADB8]">{t.emptyConversation}</p>
              </div>

              <MoneyAIQuickActions language={language} onSelect={onSuggestedQuestion} />

              <p className="text-xs text-[#707680]">{t.voiceHint}</p>
            </div>
          ) : (
            messages.map((message) => (
              <MoneyAIMessage
                key={message.id}
                message={message}
                onCopy={onCopy}
                onPlay={onPlay}
                onRetry={onRetry}
                showRetry={message.role === "assistant" && lastAssistant?.id === message.id}
              />
            ))
          )}

          {isProcessing && <p className="text-sm text-[#A5ADB8]">{t.thinking}</p>}
          {error && (
            <p className="text-sm text-[#F87171]" role="alert">
              {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {!isNearBottom && (
        <button
          type="button"
          onClick={scrollToLatest}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#BFC4CC]/30 bg-black/70 px-4 py-2 text-xs text-[#D5D8DD] shadow-lg backdrop-blur-xl transition hover:bg-black/90"
        >
          <ChevronDown size={14} /> {t.jumpToLatest}
        </button>
      )}
    </div>
  )
}
