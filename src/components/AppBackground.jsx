// Single global background: one <video> instance shared by the login
// screen and the entire authenticated app. Mount this once, at the top
// of App.jsx, outside any auth-state branching — that's what keeps it
// from being torn down and recreated as the user logs in/out, and keeps
// every page from rendering its own copy.
export default function AppBackground() {
  return (
    <div className="fixed inset-0 -z-20" aria-hidden="true" tabIndex="-1">
      <video
        className="h-full w-full object-cover"
        src="/videos/money-mind.bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        tabIndex="-1"
      />
      <div className="absolute inset-0 bg-black/[0.42]" />
    </div>
  )
}
