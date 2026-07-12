// Selectable ambient background videos, shared by the login screen and
// the entire authenticated app (see components/AppBackground.jsx). To add
// a newly uploaded video: drop the file in public/videos/ and add one
// entry here — nothing else needs to change, the Theme panel in Settings
// and AppBackground both read from this single list.
export const BACKGROUND_THEMES = [
  {
    id: "default",
    label: "Money Mind Default",
    description: "The original Money Mind ambient background.",
    src: "/videos/money-mind.bg.mp4",
  },
  ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((n) => ({
    id: `theme-${n}`,
    label: `Theme ${n}`,
    description: "Alternate Money Mind ambient background.",
    src: `/videos/money mind.bg ${n}.mp4`,
  })),
]

export const DEFAULT_BACKGROUND_THEME = BACKGROUND_THEMES[0].id

export function getBackgroundTheme(id) {
  return BACKGROUND_THEMES.find((theme) => theme.id === id) || BACKGROUND_THEMES[0]
}
