import { useEffect, useRef, useState } from "react"

const LOGIN_HEIGHT = "clamp(180px, 21vw, 280px)"
const SIDEBAR_TEXT_SIZE = "clamp(22px, 2.4vw, 32px)"
// The mark PNG (public/money-mind-mark.png) has the M glyph filling ~72%
// of its square frame's height (soft glow padding around it). Scaling the
// frame to ~2.9x the wordmark's font size makes the drawn glyph's visible
// height match the two-line "MONEY / MIND" text block (2 lines * 1.05
// leading) at every viewport width, since both are driven by the same
// SIDEBAR_TEXT_SIZE clamp.
const SIDEBAR_MARK_HEIGHT = `calc(${SIDEBAR_TEXT_SIZE} * 2.9)`
const BASE_TRACKING_EM = 0.14
const MAX_TRACKING_EM = 0.5

// Measures the rendered width of MONEY vs MIND after fonts load and, if
// MIND is narrower, nudges its own letter-spacing (only) until the two
// words end at approximately the same right edge — MONEY stacked above,
// flush-aligned with MIND below. Falls back to the shared base tracking
// if measurement isn't available (SSR, etc.).
function useBalancedTracking() {
  const primaryRef = useRef(null)
  const secondaryRef = useRef(null)
  const [secondaryTracking, setSecondaryTracking] = useState(BASE_TRACKING_EM)

  useEffect(() => {
    const primaryEl = primaryRef.current
    const secondaryEl = secondaryRef.current
    if (!primaryEl || !secondaryEl) return

    function measure() {
      secondaryEl.style.letterSpacing = `${BASE_TRACKING_EM}em`

      const primaryWidth = primaryEl.getBoundingClientRect().width
      const secondaryWidth = secondaryEl.getBoundingClientRect().width
      const shortfall = primaryWidth - secondaryWidth

      if (shortfall <= 0) {
        setSecondaryTracking(BASE_TRACKING_EM)
        return
      }

      const fontSize = parseFloat(getComputedStyle(secondaryEl).fontSize) || 16
      const charCount = secondaryEl.textContent.length || 1
      const extraEm = shortfall / charCount / fontSize

      setSecondaryTracking(Math.min(BASE_TRACKING_EM + extraEm, MAX_TRACKING_EM))
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(measure)
    } else {
      measure()
    }

    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return { primaryRef, secondaryRef, secondaryTracking }
}

// The full Money Mind logo (M mark + "MONEY MIND" wordmark), as uploaded
// to public/. Used on the Login/Register screen. Static: no rotation,
// flip, or animation; hover only lifts brightness slightly.
export function LoginLogo({ className = "" }) {
  return (
    <img
      src="/money-mind-logo.png"
      alt="Money Mind"
      className={`money-mind-logo object-contain ${className}`}
      style={{ height: LOGIN_HEIGHT, width: "auto" }}
    />
  )
}

// The horizontal brand lockup used in the app chrome: the M mark
// (cropped from the same uploaded logo, public/money-mind-mark.png) on
// the left, MONEY stacked above MIND on the right, both flush to the
// same left edge with MIND's tracking balanced to match MONEY's width.
export function SidebarLogo({ className = "" }) {
  const { primaryRef, secondaryRef, secondaryTracking } = useBalancedTracking()

  return (
    <div className={`money-mind-logo inline-flex items-center gap-3 ${className}`}>
      <img
        src="/money-mind-mark.png"
        alt="Money Mind"
        className="shrink-0 object-contain"
        style={{ height: SIDEBAR_MARK_HEIGHT, width: "auto" }}
      />

      <div className="flex flex-col items-start leading-[1.05]" style={{ fontSize: SIDEBAR_TEXT_SIZE }}>
        <span ref={primaryRef} className="money-mind-logo-text" style={{ letterSpacing: `${BASE_TRACKING_EM}em` }}>
          MONEY
        </span>
        <span ref={secondaryRef} className="money-mind-logo-text" style={{ letterSpacing: `${secondaryTracking}em` }}>
          MIND
        </span>
      </div>
    </div>
  )
}
