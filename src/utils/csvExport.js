function escapeCsvValue(value) {
  const stringValue = String(value ?? "")

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

function todayStamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function rowsToCsv(headers, rows) {
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ]

  return lines.join("\r\n")
}

// Prefixes a UTF-8 BOM so Excel reads accented characters and the
// currency symbols used throughout Money Mind correctly.
export function downloadCsv(baseName, headers, rows) {
  const csvBody = rowsToCsv(headers, rows)
  const blob = new Blob(["﻿" + csvBody], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `${baseName}-${todayStamp()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
