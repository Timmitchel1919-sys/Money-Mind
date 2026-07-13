import { DEFAULT_BACKGROUND_THEME, getBackgroundTheme } from "../constants/backgroundThemes"

// Single global background: one <video> instance shared by the login
// screen and the entire authenticated app. Mount this once, at the top
// of App.jsx, outside any auth-state branching — that's what keeps it
// from being torn down and recreated as the user logs in/out, and keeps
// every page from rendering its own copy. The video itself is whichever
// theme is selected in Settings > Theme (see constants/backgroundThemes.js).
export default function AppBackground({ themeId = DEFAULT_BACKGROUND_THEME }) {
  const theme = getBackgroundTheme(themeId)

  return (
    <div className="fixed inset-0 -z-20" aria-hidden="true" tabIndex="-1">
      {theme.type === "image" ? (
        <img
          key={theme.src}
          className="h-full w-full object-cover"
          src={theme.src}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <video
          key={theme.src}
          className="h-full w-full object-cover"
          src={theme.src}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          tabIndex="-1"
        />
      )}
      <div className="absolute inset-0 bg-black/[0.42]" />
    </div>
  )
}
