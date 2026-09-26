import { DomainValidationError } from "./errors.js";

/** @typedef {string} CurrencyCode */

const precisionCache = new Map();
const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"));

/**
 * Normalizes a currency code to uppercase three-letter ISO format.
 * @param {string} value 
 * @returns {CurrencyCode}
 */
export function normalizeCurrencyCode(value) {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new DomainValidationError("Currency must be a three-letter ISO-style code.");
  currencyFractionDigits(code);
  return code;
}

/**
 * Retrieves the number of fraction digits supported by a currency code.
 * @param {string} value 
 * @returns {number}
 */
export function currencyFractionDigits(value) {
  const code = value.trim().toUpperCase();
  const cached = precisionCache.get(code);
  if (cached !== undefined) return cached;
  
  if (!/^[A-Z]{3}$/.test(code)) throw new DomainValidationError("Currency must be a three-letter ISO-style code.");
  if (!supportedCurrencies.has(code)) throw new DomainValidationError(`Unsupported currency code: ${code}.`);
  
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits;
    if (digits === undefined) throw new DomainValidationError(`Currency precision metadata is unavailable for ${code}.`);
    if (digits < 0 || digits > 3) throw new DomainValidationError(`Unsupported currency precision for ${code}.`);
    precisionCache.set(code, digits);
    return digits;
  } catch (error) {
    if (error instanceof DomainValidationError) throw error;
    throw new DomainValidationError(`Unsupported currency code: ${code}.`);
  }
}
