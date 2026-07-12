// Single unified glass workspace for Money AI — header, conversation, and
// composer all live inside this one card (no separate Conversation/Voice
// cards). Height-locked and sticky at every breakpoint, matching
// DashboardLayout's Sidebar/Topbar freeze, so only the conversation area
// scrolls — main is the single scroll region everywhere now.
export default function MoneyAIChatShell({ children }) {
  return (
    <div className="sticky top-0 flex h-[calc(100vh-170px)] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-2xl">
      {children}
    </div>
  )
}
