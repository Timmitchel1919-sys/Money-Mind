const LOGO_SRC = "/money-mind-logo 2.png"

const LOGIN_HEIGHT = "clamp(140px, 17vw, 220px)"
const SIDEBAR_HEIGHT = "clamp(64px, 7vw, 96px)"

// The Money Mind logo (M mark + "MONEY MIND" wordmark), as uploaded to
// public/. Used on the Login/Register screen. Static: no rotation, flip,
// or animation; hover only lifts brightness slightly.
export function LoginLogo({ className = "" }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Money Mind"
      className={`money-mind-logo object-contain ${className}`}
      style={{ height: LOGIN_HEIGHT, width: "auto" }}
    />
  )
}

// Same logo file, used as the app chrome brand mark (sidebar header).
export function SidebarLogo({ className = "" }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Money Mind"
      className={`money-mind-logo object-contain ${className}`}
      style={{ height: SIDEBAR_HEIGHT, width: "auto" }}
    />
  )
}
