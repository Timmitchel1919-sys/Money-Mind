export default function NavItem({ label, value, icon: Icon, activePage, setActivePage }) {
  const active = activePage === value

  return (
    <button
      onClick={() => setActivePage(value)}
      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
        active
          ? "border border-[#BFC4CC]/20 bg-[#1F242D] text-white"
          : "text-[#D5D8DD] hover:bg-white/5"
      }`}
    >
      {Icon && <Icon size={18} className="shrink-0 text-[#A5ADB8]" strokeWidth={1.75} aria-hidden="true" />}
      <span className="truncate">{label}</span>
    </button>
  )
}
