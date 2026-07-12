import { CURRENCIES, CURRENCY_CODES } from "../constants/currencies"
import { getCurrencyEquivalents, formatCurrencyAmount, ratesAreUsable } from "../utils/currencyConversion"

// Central "Excel-freeze-panes"-style companion for money values: shows the
// amount in its own currency, plus small muted equivalents in the other two
// supported currencies. Never mutates or replaces the original amount/currency
// — equivalents are purely derived for display.
export default function MultiCurrencyAmount({
  amount,
  currency = "SRD",
  rates,
  numberFormat = "1,234.56",
  showPrimary = true,
  showEquivalents = true,
  variant = "block",
  loading = false,
  className = "",
}) {
  const hasRates = ratesAreUsable(rates)
  const otherCodes = CURRENCY_CODES.filter((code) => code !== currency)

  if (loading) {
    const Wrapper = variant === "inline" ? "span" : "div"
    return (
      <Wrapper className={`text-sm text-[#707680] ${className}`}>
        Loading rates…
      </Wrapper>
    )
  }

  const equivalents = hasRates ? getCurrencyEquivalents({ amount, currency, rates }) : null

  if (variant === "inline") {
    return (
      <span className={`text-sm text-[#A5ADB8] ${className}`}>
        {showPrimary && (
          <span className="mr-2 font-semibold text-[#D5D8DD]">
            {formatCurrencyAmount(amount, currency, numberFormat)}
          </span>
        )}
        {showEquivalents &&
          (hasRates
            ? otherCodes
                .map(
                  (code) =>
                    `≈ ${CURRENCIES[code].flag} ${formatCurrencyAmount(equivalents[code], code, numberFormat)}`
                )
                .join("   ")
            : "Rates unavailable")}
      </span>
    )
  }

  return (
    <div className={className}>
      {showPrimary && (
        <p className="flex items-center gap-2 text-2xl font-bold text-[#FAFAFA]">
          <span>{CURRENCIES[currency]?.flag}</span>
          <span>{formatCurrencyAmount(amount, currency, numberFormat)}</span>
        </p>
      )}

      {showEquivalents && (
        <div className="mt-1 space-y-0.5">
          {hasRates ? (
            otherCodes.map((code) => (
              <p key={code} className="text-sm text-[#A5ADB8]">
                ≈ {CURRENCIES[code].flag} {formatCurrencyAmount(equivalents[code], code, numberFormat)}
              </p>
            ))
          ) : (
            <p className="text-sm text-[#707680]">Rates unavailable</p>
          )}
        </div>
      )}
    </div>
  )
}
