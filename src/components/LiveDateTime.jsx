import useLiveDateTime from "../hooks/useLiveDateTime"

export default function LiveDateTime({ timeFormat, dateFormat, language, className = "" }) {
  const { formattedTime, formattedSeconds, formattedDate } = useLiveDateTime({ timeFormat, dateFormat, language })

  const match = formattedTime.match(/^(\d{1,2}):(\d{2})\s?(.*)$/)
  const [, hours, minutes, suffix] = match || [null, formattedTime, "", ""]

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/25 px-4 py-2.5 text-right backdrop-blur-xl ${className}`}
    >
      <p className="font-mono text-xl font-bold tracking-wider text-white">
        <span>{hours}</span>
        <span>:</span>
        <span>{minutes}</span>
        {suffix && <span className="ml-1 text-sm font-bold">{suffix}</span>}
        <span className="ml-1 align-top text-xs font-bold">{formattedSeconds}</span>
      </p>

      <p className="mt-0.5 text-sm font-bold text-white">{formattedDate}</p>
    </div>
  )
}
