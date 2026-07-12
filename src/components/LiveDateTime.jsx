import useLiveDateTime from "../hooks/useLiveDateTime"

export default function LiveDateTime({ timeFormat, dateFormat, language, className = "" }) {
  const { formattedTime, formattedSeconds, formattedDate } = useLiveDateTime({ timeFormat, dateFormat, language })

  const match = formattedTime.match(/^(\d{1,2}):(\d{2})\s?(.*)$/)
  const [, hours, minutes, suffix] = match || [null, formattedTime, "", ""]

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/25 px-5 py-3.5 text-right backdrop-blur-xl ${className}`}
    >
      <p className="font-mono text-3xl font-semibold tracking-wider">
        <span className="gold-text">{hours}</span>
        <span className="text-[#FBBF24]">:</span>
        <span className="gold-text">{minutes}</span>
        {suffix && <span className="ml-1 text-base font-normal text-[#D9B45C]">{suffix}</span>}
        <span className="ml-1.5 align-top text-sm font-normal text-[#D9B45C]">{formattedSeconds}</span>
      </p>

      <p className="mt-1 text-base text-[#E8C56B]">{formattedDate}</p>
    </div>
  )
}
