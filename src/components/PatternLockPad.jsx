const DOT_COUNT = 9

function dotCenter(index) {
  const col = index % 3
  const row = Math.floor(index / 3)
  return { x: (col + 0.5) * (100 / 3), y: (row + 0.5) * (100 / 3) }
}

// 3x3 tap-sequence pattern lock (tap dots in order, rather than a
// continuous drag — functionally equivalent as a shared secret, and far
// simpler/more reliable across mouse and touch than drag-tracking). Fully
// controlled: the caller owns `pattern` and calls onClear/reads it back.
export default function PatternLockPad({ pattern, onChange, minLength = 4 }) {
  function toggleDot(index) {
    if (pattern.includes(index)) return
    onChange([...pattern, index])
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-56">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          {pattern.slice(1).map((dotIndex, i) => {
            const from = dotCenter(pattern[i])
            const to = dotCenter(dotIndex)
            return (
              <line
                key={`${pattern[i]}-${dotIndex}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--brand-primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        <div className="relative grid h-full w-full grid-cols-3 place-items-center">
          {Array.from({ length: DOT_COUNT }).map((_, index) => {
            const isSelected = pattern.includes(index)
            const order = pattern.indexOf(index)

            return (
              <button
                key={index}
                type="button"
                onClick={() => toggleDot(index)}
                aria-label={`Pattern dot ${index + 1}${isSelected ? `, selected (step ${order + 1})` : ""}`}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                  isSelected
                    ? "border-[#3aaf90] bg-[#3aaf90]/20 text-[#3aaf90]"
                    : "border-[#BFC4CC]/35 bg-black/20 text-transparent hover:border-[#BFC4CC]/60"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-[#A5ADB8]">
          {pattern.length === 0
            ? `Tap at least ${minLength} dots in order`
            : `${pattern.length} dot${pattern.length === 1 ? "" : "s"} selected`}
        </p>
        {pattern.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-[#D5D8DD] underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
