export default function Card({
  title,
  value,
  subtitle = "",
  icon = null,
}) {
  return (
    <div className="surface-card group relative overflow-hidden p-5 transition-colors duration-300 hover:border-[var(--border-strong)]">
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {title}
          </p>

          {icon && (
            <div className="text-[#C9CDD3]">
              {icon}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
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
