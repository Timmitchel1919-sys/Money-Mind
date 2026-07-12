export default function Card({
  title,
  value,
  subtitle = "",
  icon = null,
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-[#707680]/40 bg-[#1F242D]/70 p-6 backdrop-blur-xl transition-colors duration-300 hover:border-[#C9CDD3]/50">
      {/* Glass Highlight */}
      <div className="absolute inset-0 'bg-gradient-to-br' from-white/5 via-transparent to-transparent" />

      {/* Metallic Glow */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-wide text-[#A5ADB8]">
            {title}
          </p>

          {icon && (
            <div className="text-[#C9CDD3]">
              {icon}
            </div>
          )}
        </div>

        <h2 className="text-3xl font-bold text-[#FAFAFA]">
          {value}
        </h2>

        {subtitle && (
          <p className="mt-3 text-sm text-[#A5ADB8]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}