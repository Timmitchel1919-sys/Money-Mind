import { useEffect, useState } from "react"

const LOCALE_MAP = { en: "en-US", nl: "nl-NL", es: "es-ES" }

function pad(value) {
  return String(value).padStart(2, "0")
}

function formatDate(date, dateFormat, locale) {
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()

  switch (dateFormat) {
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`
    case "MM-DD-YYYY":
      return `${month}-${day}-${year}`
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`
    case "long":
      return new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", year: "numeric" }).format(date)
    case "day-long":
      return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(date)
    case "weekday-long":
    default:
      return new Intl.DateTimeFormat(locale, {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date)
  }
}

// Ticks every second; always cleans up its interval on unmount so no
// timer keeps running after navigating away or logging out.
export default function useLiveDateTime({ timeFormat = "24h", dateFormat = "weekday-long", language = "en" } = {}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const locale = LOCALE_MAP[language] || "en-US"

  const formattedTime = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "12h",
  }).format(now)

  const formattedSeconds = pad(now.getSeconds())
  const formattedDate = formatDate(now, dateFormat, locale)

  return { now, formattedTime, formattedSeconds, formattedDate }
}
