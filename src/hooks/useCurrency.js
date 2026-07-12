import { useCallback, useEffect, useRef, useState } from "react"
import { getExchangeRates } from "../services/currencyService"

const FALLBACK_RATES = { SRD: 1, USD: 0.0265, EUR: 0.0228 }
const MIN_REFRESH_INTERVAL_MS = 10000

// Single, centrally-instantiated source of live exchange rates (see App.jsx)
// — every page reads from this hook's output instead of fetching its own
// rates, satisfying "rates are loaded centrally, not fetched per card".
export default function useCurrency() {
  const [rates, setRates] = useState(FALLBACK_RATES)
  const [rateStatus, setRateStatus] = useState("loading") // loading | live | cached | unavailable
  const [updatedAt, setUpdatedAt] = useState(null)
  const [rateError, setRateError] = useState("")
  const fetchingRef = useRef(false)
  const lastFetchRef = useRef(0)

  const refreshRates = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current) return
    if (forceRefresh && Date.now() - lastFetchRef.current < MIN_REFRESH_INTERVAL_MS) return

    fetchingRef.current = true
    lastFetchRef.current = Date.now()
    setRateStatus((prev) => (prev === "live" || prev === "cached" ? prev : "loading"))

    try {
      const result = await getExchangeRates({ forceRefresh })
      setRates(result.rates)
      setUpdatedAt(result.updatedAt)
      setRateStatus(result.source === "live" ? "live" : "cached")
      setRateError(result.error || "")
    } catch (error) {
      setRateStatus("unavailable")
      setRateError(error?.message || "Exchange rates are unavailable.")
    } finally {
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    refreshRates(false)
  }, [refreshRates])

  // Manual converter UI state, used by the Currency Center page.
  const [converterAmount, setConverterAmount] = useState("100")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("SRD")

  return {
    rates,
    rateStatus,
    updatedAt,
    rateError,
    refreshRates,
    converterAmount,
    setConverterAmount,
    fromCurrency,
    setFromCurrency,
    toCurrency,
    setToCurrency,
  }
}
