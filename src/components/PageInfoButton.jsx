import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import pageInfo from "../constants/pageInfo"

// The "+" button next to the page title in the Topbar. Opens a modal
// explaining the current page's purpose, what happens on it, and how it
// works — content is looked up from pageInfo by the active page's key.
export default function PageInfoButton({ pageKey }) {
  const [isOpen, setIsOpen] = useState(false)
  const info = pageInfo[pageKey]

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Closing the modal should not be possible before it exists.
  useEffect(() => {
    if (!info) setIsOpen(false)
  }, [info])

  if (!info) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`About the ${info.title} page`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#BFC4CC]/30 text-[#D5D8DD] transition hover:bg-white/5"
      >
        <Plus size={16} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`About ${info.title}`}
            onClick={(e) => e.stopPropagation()}
            className="scrollbar-transparent max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#707680]/50 bg-[#171B22]/95 p-6 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold">{info.title}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#A5ADB8] transition hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-5 text-[#D5D8DD]">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#A5ADB8]">
                  Purpose
                </h3>
                <p className="mt-1.5">{info.purpose}</p>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#A5ADB8]">
                  What happens here
                </h3>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {info.whatHappens.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#A5ADB8]">
                  How it works
                </h3>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {info.howItWorks.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
