import { currencyFractionDigits, normalizeCurrencyCode } from "./currency.js";
import { CurrencyMismatchError, InvalidMoneyInputError, UnsafeMoneyIntegerError } from "./errors.js";

/**
 * @typedef {object} Money
 * @property {number} amountMinor - The amount in minor units (e.g. cents) represented as a safe integer.
 * @property {string} currency - The three-letter ISO currency code.
 */

/**
 * Ensures a number is a safe integer before assigning it to a monetary amount.
 * @param {number} value 
 * @returns {number}
 */
function safeInteger(value) {
  if (!Number.isSafeInteger(value)) throw new UnsafeMoneyIntegerError();
  return value;
}

/**
 * Ensures two Money objects share the same currency.
 * @param {Money} left 
 * @param {Money} right 
 */
function sameCurrency(left, right) {
  if (left.currency !== right.currency) throw new CurrencyMismatchError(left.currency, right.currency);
}

/**
 * Creates a valid Money object.
 * @param {number} amountMinor 
 * @param {string} currency 
 * @returns {Money}
 */
export function createMoney(amountMinor, currency) { 
  return { amountMinor: safeInteger(amountMinor), currency: normalizeCurrencyCode(currency) }; 
}

/**
 * Adds two Money amounts.
 * UNSPECIFIED FINANCIAL POLICY: Rounding behavior is not applicable for addition of integers.
 * @param {Money} left 
 * @param {Money} right 
 * @returns {Money}
 */
export function addMoney(left, right) { 
  sameCurrency(left, right); 
  return createMoney(safeInteger(left.amountMinor + right.amountMinor), left.currency); 
}

/**
 * Subtracts two Money amounts (left - right).
 * UNSPECIFIED FINANCIAL POLICY: Rounding behavior is not applicable for subtraction of integers.
 * @param {Money} left 
 * @param {Money} right 
 * @returns {Money}
 */
export function subtractMoney(left, right) { 
  sameCurrency(left, right); 
  return createMoney(safeInteger(left.amountMinor - right.amountMinor), left.currency); 
}

/**
 * Negates a Money amount.
 * @param {Money} value 
 * @returns {Money}
 */
export function negateMoney(value) { 
  return createMoney(safeInteger(-value.amountMinor), value.currency); 
}

/**
 * Compares two Money amounts. Returns -1 if left < right, 1 if left > right, and 0 if equal.
 * @param {Money} left 
 * @param {Money} right 
 * @returns {-1 | 0 | 1}
 */
export function compareMoney(left, right) { 
  sameCurrency(left, right); 
  return left.amountMinor < right.amountMinor ? -1 : left.amountMinor > right.amountMinor ? 1 : 0; 
}

export function isZeroMoney(value) { return value.amountMinor === 0; }
export function isPositiveMoney(value) { return value.amountMinor > 0; }
export function isNegativeMoney(value) { return value.amountMinor < 0; }

/**
 * Parses a string input representing a decimal monetary amount into minor units.
 * UNSPECIFIED FINANCIAL POLICY: Explicit fractional truncation/rounding is not defined by prototype; 
 * strictly rejects inputs exceeding the currency's maximum fractional digits.
 * @param {string} input 
 * @param {string} currency 
 * @returns {Money}
 */
export function parseMoneyInput(input, currency) {
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

/**
 * Formats a Money object into a localized string.
 * @param {Money} value 
 * @param {string} locale 
 * @returns {string}
 */
export function formatMoney(value, locale = "en") {
  const money = createMoney(value.amountMinor, value.currency);
  const digits = currencyFractionDigits(money.currency);
  // Uses floating point for standard UI representation, acceptable as it is the final string boundary.
  return new Intl.NumberFormat(locale, { 
    style: "currency", 
    currency: money.currency, 
    minimumFractionDigits: digits, 
    maximumFractionDigits: digits 
  }).format(money.amountMinor / (10 ** digits));
}

// UNSPECIFIED FINANCIAL POLICY: 
// Multiplication, division, and percentage applications (including their rounding behaviors) 
// are absent from the prototype and explicitly not defined here.
