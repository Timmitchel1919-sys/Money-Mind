import { useEffect, useState } from "react"
import { Bot, X } from "lucide-react"
import MoneyAI from "../pages/AIFinancialCoach"

// Money AI is no longer its own page — it's reachable from anywhere in the
// app via this floating launcher, which slides the exact same MoneyAI
// component (untouched, same hooks/functions) in as an overlay panel.
// Only the AI's *container* changed; its Voice settings still live in
// Settings (see Settings.jsx "Money AI Voice" panel).
export default function MoneyAIWidget({ setActivePage, ...moneyAIProps }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // MoneyAI's composer only ever calls setActivePage to jump to the Voice
  // settings panel — close the drawer on the way there so the settings
  // page isn't hidden behind this overlay.
  function goToSettings() {
    setIsOpen(false)
    setActivePage?.("settings")
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close Money AI" : "Open Money AI"}
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E] text-black shadow-[0_0_24px_rgba(34,197,94,0.55)] transition hover:scale-105 hover:shadow-[0_0_32px_rgba(34,197,94,0.8)] active:scale-95"
      >
        {isOpen ? <X size={24} /> : <Bot size={26} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-40 w-full max-w-[1100px] p-4 transition-transform duration-300 ease-out md:p-6 ${
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Money AI"
      >
        <div className="h-full overflow-y-auto rounded-3xl border border-white/10 bg-[#0E1117]/95 p-4 backdrop-blur-2xl md:p-6">
          {isOpen && <MoneyAI {...moneyAIProps} setActivePage={setActivePage ? goToSettings : undefined} />}
        </div>
      </div>
    </>
  )
}
