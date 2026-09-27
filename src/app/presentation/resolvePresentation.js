// Layer 8 (V2 UI cutover): the single decision of WHICH presentation layer an
// app state renders. Pure and deterministic, so it can be tested without React.
//
//   public  — signed out: PublicExperience (and the flag-gated #spatial demo)
//   locked  — signed in but the app lock is engaged: AppLockScreen (always wins)
//   v2      — signed in, V2 app shell enabled: the V2 Spatial Application
//   legacy  — signed in, V2 shell off, or the user explicitly chose Classic view:
//             the V1 presentation layer (DashboardLayout + pages)
//
// Presentation only: every path shares the same auth, Firebase, hooks and
// financial data, which live below this boundary in App.jsx.

export const PRESENTATIONS = Object.freeze({ public: "public", locked: "locked", v2: "v2", legacy: "legacy" })

export function resolvePresentation({ signedIn = false, locked = false, v2AppShell = false, classicRequested = false } = {}) {
  if (!signedIn) return PRESENTATIONS.public
  if (locked) return PRESENTATIONS.locked
  if (v2AppShell && !classicRequested) return PRESENTATIONS.v2
  return PRESENTATIONS.legacy
}
