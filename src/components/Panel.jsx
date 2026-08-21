export default function Panel({ title, children }) {
  return (
    <div className="glass-card p-5 transition-colors duration-300 hover:border-[var(--border-strong)] sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  )
}
