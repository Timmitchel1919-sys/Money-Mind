import { useEffect, useRef, useState } from "react"
import { LoginLogo } from "./MoneyMindLogo"

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Cinematic, one-shot intro that plays once in front of the login/register
// form: video -> logo reveal at the light-beam collision (~1.45s) -> auth
// card reveal (~3.2s) -> video ends and only the static black/logo/card
// state remains. Skipped entirely under prefers-reduced-motion.
export default function AuthIntro({ children }) {
  const videoRef = useRef(null)
  const reducedMotion = useRef(prefersReducedMotion()).current

  const [showLogo, setShowLogo] = useState(reducedMotion)
  const [showAuthCard, setShowAuthCard] = useState(reducedMotion)
  const [introFinished, setIntroFinished] = useState(reducedMotion)

  useEffect(() => {
    if (reducedMotion) return

    const video = videoRef.current
    if (!video) return

    function handleTimeUpdate() {
      const currentTime = video.currentTime

      // Around the moment the two light beams collide.
      if (currentTime >= 1.45 && !showLogo) {
        setShowLogo(true)
      }

      // Reveal the login/register card shortly after.
      if (currentTime >= 3.2 && !showAuthCard) {
        setShowAuthCard(true)
      }
    }

    function handleEnded() {
      setIntroFinished(true)
      setShowLogo(true)
      setShowAuthCard(true)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [reducedMotion, showLogo, showAuthCard])

  function handleSkip() {
    setShowLogo(true)
    setShowAuthCard(true)
    setIntroFinished(true)

    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {!introFinished && (
        <video
          ref={videoRef}
          className="fixed inset-0 h-full w-full object-cover"
          src="/videos/money-mind-intro.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      )}

      <div className="fixed inset-0 bg-black/25" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="flex w-full flex-col items-center">
          <div
            className={`drop-shadow-[0_0_30px_rgba(255,255,255,0.55)] ${
              reducedMotion ? "" : "transition-all duration-1000 ease-out"
            } ${
              showLogo ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-75 opacity-0"
            } ${showAuthCard ? "-translate-y-4 scale-90" : ""}`}
          >
            <LoginLogo />
          </div>

          <div
            className={`mt-6 w-full max-w-md ${reducedMotion ? "" : "transition-all duration-1000 ease-out"} ${
              showAuthCard
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-12 opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      </div>

      {!showAuthCard && (
        <button
          type="button"
          onClick={handleSkip}
          className="fixed bottom-6 right-6 z-20 rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-black/60 hover:text-white"
        >
          Skip Intro
        </button>
      )}
    </div>
  )
}
