export default function StickyBar({ title, children, className = "" }) {
  return (
    <div
      className={`sticky top-0 z-20 rounded-3xl border border-[#707680]/50 bg-[#171B22]/90 p-6 shadow-2xl backdrop-blur-xl transition-colors duration-300 hover:border-[#C9CDD3]/40 ${className}`}
    >
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </div>
  )
}
