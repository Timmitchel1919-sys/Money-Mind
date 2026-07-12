import { CURRENCY_CODES } from "../constants/currencies"

// Free, keyless exchange-rate provider — no API key to protect, so this can
// safely stay client-side. Kept behind this one function so the call site
// (useCurrency) never talks to the provider directly; swapping this for a
// Firebase callable function later only means changing fetchLiveRates.
const PROVIDER_URL = "https://open.er-api.com/v6/latest"
const CACHE_KEY = "money-mind-exchange-rates"
const CACHE_DURATION_MS = 45 * 60 * 1000
const PIVOT_CURRENCY = "SRD"

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || !parsed.rates) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — caching
    // is a best-effort optimization, not a requirement for correctness.
  }
}

function isFresh(entry) {
  if (!entry?.expiresAt) return false
  return Date.now() < new Date(entry.expiresAt).getTime()
}

function pickSupportedRates(rawRates) {
  const rates = {}
  for (const code of CURRENCY_CODES) {
    const value = Number(rawRates?.[code])
    rates[code] = Number.isFinite(value) && value > 0 ? value : null
  }
  return rates
}

async function fetchLiveRates(baseCurrency) {
  const base = CURRENCY_CODES.includes(baseCurrency) ? baseCurrency : PIVOT_CURRENCY
  const response = await fetch(`${PROVIDER_URL}/${base}`)
  if (!response.ok) {
    throw new Error(`Exchange rate provider responded with status ${response.status}`)
  }

  const data = await response.json()
  if (data?.result !== "success" || !data.rates) {
    throw new Error("Exchange rate provider returned an unexpected response")
  }

  const rates = pickSupportedRates(data.rates)
  if (Object.values(rates).some((value) => value === null)) {
    throw new Error("Exchange rate provider did not return all supported currencies")
  }

  return {
    base,
    rates,
    updatedAt: new Date().toISOString(),
    source: "live",
  }
}

// Returns { base, rates: { SRD, USD, EUR }, updatedAt, source, expiresAt }.
// `rates[code]` is how many units of `code` equal 1 unit of `base`.
export async function getExchangeRates({ baseCurrency = PIVOT_CURRENCY, forceRefresh = false } = {}) {
  const cached = readCache()

  if (!forceRefresh && cached && isFresh(cached) && cached.base === baseCurrency) {
    return { ...cached, source: "cached" }
  }

  try {
    const live = await fetchLiveRates(baseCurrency)
    const entry = { ...live, expiresAt: new Date(Date.now() + CACHE_DURATION_MS).toISOString() }
    writeCache(entry)
    return entry
  } catch (error) {
    if (cached) {
      return { ...cached, source: "cached", error: error.message }
    }
    throw error
  }
}

export function clearRatesCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // ignore
  }
}
