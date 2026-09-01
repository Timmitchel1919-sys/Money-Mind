// Selectable ambient backgrounds (video or static image), shared by the
// login screen and the entire authenticated app (see
// components/AppBackground.jsx). To add a newly uploaded file: drop the
// video in public/videos/ (or the image in public/) and add one entry
// here — nothing else needs to change, the Theme panel in Settings and
// AppBackground both read from this single list and branch on `type`.
export const BACKGROUND_THEMES = [
  ...[4, 5, 7, 12, 13].map((n) => ({
    id: `theme-${n}`,
    label: `Theme ${n}`,
    description: "Alternate Money Mind ambient background.",
    type: "video",
    src: `/videos/money mind.bg ${n}.mp4`,
  })),
  ...[11, 13].map((n) => ({
    id: `photo-${n}`,
    label: `Photo ${n}`,
    description: "Alternate Money Mind ambient background (static photo).",
    type: "image",
    src: `/money mind.bg ${n}.jpg`,
  })),
]

export const DEFAULT_BACKGROUND_THEME = BACKGROUND_THEMES[0].id

// In dark mode the whole platform uses a fixed ambient video instead of
// the Settings picker: always the most recently added video theme. Drop a
// new `/videos/money mind.bg N.mp4` in and add its entry to the video list
// above and it becomes the dark-mode background automatically — today
// that's Theme 13 (the list ends on 13).
export const DARK_BACKGROUND_THEME =
  [...BACKGROUND_THEMES].reverse().find((theme) => theme.type === "video")?.id ||
  DEFAULT_BACKGROUND_THEME

export function getBackgroundTheme(id) {
  return BACKGROUND_THEMES.find((theme) => theme.id === id) || BACKGROUND_THEMES[0]
}
