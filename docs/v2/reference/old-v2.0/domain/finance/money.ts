import { currencyFractionDigits, normalizeCurrencyCode } from "./currency.ts";
import { CurrencyMismatchError, InvalidMoneyInputError, UnsafeMoneyIntegerError } from "./errors.ts";
import type { Money } from "@/types/finance";

function safeInteger(value: number): number {
  if (!Number.isSafeInteger(value)) throw new UnsafeMoneyIntegerError();
  return value;
}
function sameCurrency(left: Money, right: Money) {
  if (left.currency !== right.currency) throw new CurrencyMismatchError(left.currency, right.currency);
}
export function createMoney(amountMinor: number, currency: string): Money { return { amountMinor: safeInteger(amountMinor), currency: normalizeCurrencyCode(currency) }; }
export function addMoney(left: Money, right: Money): Money { sameCurrency(left, right); return createMoney(safeInteger(left.amountMinor + right.amountMinor), left.currency); }
export function subtractMoney(left: Money, right: Money): Money { sameCurrency(left, right); return createMoney(safeInteger(left.amountMinor - right.amountMinor), left.currency); }
export function negateMoney(value: Money): Money { return createMoney(safeInteger(-value.amountMinor), value.currency); }
export function compareMoney(left: Money, right: Money): -1 | 0 | 1 { sameCurrency(left, right); return left.amountMinor < right.amountMinor ? -1 : left.amountMinor > right.amountMinor ? 1 : 0; }
export function isZeroMoney(value: Money) { return value.amountMinor === 0; }
export function isPositiveMoney(value: Money) { return value.amountMinor > 0; }
export function isNegativeMoney(value: Money) { return value.amountMinor < 0; }

export function parseMoneyInput(input: string, currency: string): Money {
  const code = normalizeCurrencyCode(currency);
  const value = input.trim();
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new InvalidMoneyInputError("Enter a plain decimal amount without grouping or scientific notation.");
  const digits = currencyFractionDigits(code);
  const fraction = match[3] ?? "";
  if (fraction.length > digits) throw new InvalidMoneyInputError(`${code} accepts at most ${digits} fractional digits.`);
  const combined = `${match[2]}${fraction.padEnd(digits, "0")}`.replace(/^0+(?=\d)/, "");
  const unsigned = Number(combined);
  if (!Number.isSafeInteger(unsigned)) throw new UnsafeMoneyIntegerError();
  return createMoney(match[1] === "-" ? -unsigned : unsigned, code);
}

export function formatMoney(value: Money, locale = "en"): string {
  const money = createMoney(value.amountMinor, value.currency);
  const digits = currencyFractionDigits(money.currency);
  return new Intl.NumberFormat(locale, { style: "currency", currency: money.currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(money.amountMinor / 10 ** digits);
}
