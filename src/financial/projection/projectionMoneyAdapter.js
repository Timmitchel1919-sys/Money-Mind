import { createMoney, parseMoneyInput } from "../domain/money.js";
import { currencyFractionDigits, normalizeCurrencyCode } from "../domain/currency.js";
import { createBasisPoints } from "../domain/rates.js";
import { DomainValidationError } from "../domain/errors.js";

// Currency boundary: every conversion requires an explicit ISO currency code.
// There is deliberately no default currency here — the caller (the projection
// authority) receives it from the user's reporting currency (settings.currency).

/**
 * Validates and normalizes the projection's currency context.
 * @param {string} currencyCode
 * @returns {string}
 */
export function requireCurrencyCode(currencyCode) {
  if (typeof currencyCode !== "string" || currencyCode.trim() === "") {
    throw new DomainValidationError("Projection requires an explicit currencyCode.");
  }
  return normalizeCurrencyCode(currencyCode);
}

/**
 * Converts a floating-point major value (e.g. 100.50) into a strict minor-unit Money object.
 * Rounds to the currency's own precision (SRD/USD/EUR: 2, JPY: 0, BHD: 3) to strip
 * floating-point noise before parsing. Non-finite input maps to zero, matching the
 * legacy engine's num() behavior.
 * @param {number} majorDecimal
 * @param {string} currencyCode
 * @returns {import("../domain/money.js").Money}
 */
export function toMinor(majorDecimal, currencyCode) {
  const code = requireCurrencyCode(currencyCode);
  const numValue = Number(majorDecimal);
  if (!Number.isFinite(numValue)) return createMoney(0, code);
  // Strip floating point noise (e.g., 0.1+0.2 = 0.30000000000000004 -> "0.30")
  const safeStr = numValue.toFixed(currencyFractionDigits(code));
  const money = parseMoneyInput(safeStr, code);
  // "-0.00" (tiny negative noise) parses to -0; normalize so it never renders as "-0.00".
  return money.amountMinor === 0 ? createMoney(0, code) : money;
}

/**
 * Converts a strict Money object back to a major decimal using its currency's precision.
 * @param {import("../domain/money.js").Money} moneyObj
 * @returns {number}
 */
export function toMajor(moneyObj) {
  return moneyObj.amountMinor / 10 ** currencyFractionDigits(moneyObj.currency);
}

/**
 * Converts an annual percentage rate (e.g., 5.25 for 5.25%) into BasisPoints.
 * @param {number} annualReturnPct
 * @returns {number} BasisPoints
 */
export function toBasisPoints(annualReturnPct) {
  const numValue = Number(annualReturnPct);
  if (!Number.isFinite(numValue)) return createBasisPoints(0);
  // e.g., 5.25% -> 525 bps
  const bps = Math.round(numValue * 100);
  return createBasisPoints(bps, { allowNegative: true });
}
