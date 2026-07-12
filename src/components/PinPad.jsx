import { Delete } from "lucide-react"

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"]

// Reusable numeric keypad for PIN/password-style entry. Fully controlled —
// the caller owns `value` and decides when it's complete (via maxLength
// reached, or its own submit button). `masked` swaps the dot indicator
// row for a real (optionally maskable) text value, so the same visual
// pad can drive either a PIN or a numeric fallback for other flows.
export default function PinPad({ value, onChange, maxLength = 6, label }) {
  function handleKey(key) {
    if (key === "backspace") {
      onChange(value.slice(0, -1))
      return
    }
    if (key === "" || value.length >= maxLength) return
    onChange(value + key)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3" aria-hidden="true">
        {Array.from({ length: maxLength }).map((_, index) => (
          <span
            key={index}
            className={`h-3.5 w-3.5 rounded-full border transition ${
              index < value.length ? "border-[#3aaf90] bg-[#3aaf90]" : "border-[#BFC4CC]/40 bg-transparent"
            }`}
          />
        ))}
      </div>

      {label && <p className="sr-only">{label}</p>}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, index) => {
          if (key === "") return <div key={`spacer-${index}`} />

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              aria-label={key === "backspace" ? "Delete last digit" : `Digit ${key}`}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[#BFC4CC]/25 bg-black/30 text-xl font-semibold text-[#FAFAFA] transition hover:bg-white/10 active:scale-95"
            >
              {key === "backspace" ? <Delete size={20} /> : key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
