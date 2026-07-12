import { useEffect, useRef, useState } from "react"
import { CURRENCIES, CURRENCY_CODES } from "../constants/currencies"

// Native <select> can't reliably render flag glyphs inside <option> across
// browsers, so this is a small accessible custom listbox instead.
export default function CurrencySelect({ label, value, onChange, options = CURRENCY_CODES }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(Math.max(0, options.indexOf(value)))
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) setHighlighted(Math.max(0, options.indexOf(value)))
  }, [open, options, value])

  const selected = CURRENCIES[value]

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (open) {
        onChange(options[highlighted])
        setOpen(false)
      } else {
        setOpen(true)
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) setOpen(true)
      else setHighlighted((prev) => Math.min(options.length - 1, prev + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((prev) => Math.max(0, prev - 1))
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="mb-2 block text-sm text-[#D5D8DD]">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-left text-white outline-none focus:border-[#C9CDD3]/60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-lg leading-none">{selected?.flag}</span>
          <span className="shrink-0 font-semibold">{selected?.code}</span>
          <span className="truncate text-sm text-[#A5ADB8]">{selected?.name}</span>
        </span>
        <span className="shrink-0 text-[#A5ADB8]">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#BFC4CC]/25 bg-[#111827] shadow-2xl"
        >
          {options.map((code, index) => {
            const currency = CURRENCIES[code]
            const isSelected = code === value
            const isHighlighted = index === highlighted

            return (
              <li key={code} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => {
                    onChange(code)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 p-3 text-left transition ${isHighlighted ? "bg-white/10" : ""} ${
                    isSelected ? "text-[#C9CDD3]" : "text-white"
                  }`}
                >
                  <span className="text-lg leading-none">{currency.flag}</span>
                  <span className="font-semibold">{currency.code}</span>
                  <span className="text-sm text-[#A5ADB8]">{currency.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
