export const CURRENCIES = {
  SRD: {
    code: "SRD",
    symbol: "SRD",
    flag: "🇸🇷",
    name: "Surinamese Dollar",
    colorClass: "text-[#FAFAFA]",
  },
  USD: {
    code: "USD",
    symbol: "$",
    flag: "🇺🇸",
    name: "US Dollar",
    colorClass: "text-[#4ADE80]",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    flag: "🇪🇺",
    name: "Euro",
    colorClass: "text-[#60A5FA]",
  },
}

export const CURRENCY_CODES = Object.keys(CURRENCIES)

// Tailwind text-color class for a given currency code — used to color every
// amount/symbol by currency app-wide: green for USD, blue for EUR. SRD (the
// app's base currency) keeps the default neutral text color.
export function getCurrencyColorClass(code) {
  return CURRENCIES[code]?.colorClass || "text-[#FAFAFA]"
}
