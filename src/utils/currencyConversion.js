import { CURRENCY_CODES } from "../constants/currencies"

function toFiniteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

// `rates[code]` is how many units of `code` equal 1 unit of the shared pivot
// currency (see currencyService) — any two currencies in the same rates
// object can be converted via that pivot, regardless of which one it is.
export function convertCurrency({ amount, fromCurrency, toCurrency, rates }) {
  const value = toFiniteNumber(amount)
  if (value === 0) return 0
  if (!rates || !fromCurrency || !toCurrency) return 0
  if (fromCurrency === toCurrency) return value

  const fromRate = Number(rates[fromCurrency])
  const toRate = Number(rates[toCurrency])
  if (!Number.isFinite(fromRate) || fromRate <= 0 || !Number.isFinite(toRate) || toRate <= 0) {
    return 0
  }

  const result = (value / fromRate) * toRate
  return Number.isFinite(result) ? result : 0
}

export function getCurrencyEquivalents({ amount, currency, rates }) {
  const equivalents = {}
  for (const code of CURRENCY_CODES) {
    equivalents[code] = convertCurrency({ amount, fromCurrency: currency, toCurrency: code, rates })
  }
  return equivalents
}

export function ratesAreUsable(rates) {
  return Boolean(rates) && CURRENCY_CODES.every((code) => Number.isFinite(Number(rates[code])) && Number(rates[code]) > 0)
}

export function formatCurrencyAmount(amount, currencyCode, numberFormat = "1,234.56") {
  const value = toFiniteNumber(amount)
  const locale = numberFormat === "1.234,56" ? "de-DE" : "en-US"

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`
  }
}
