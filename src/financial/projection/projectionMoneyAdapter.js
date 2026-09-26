import { createMoney, parseMoneyInput } from "../domain/money.js";
import { createBasisPoints } from "../domain/rates.js";

const ASSUMED_CURRENCY = "USD"; // Currently hardcoded as UI has no multi-currency support yet.

/**
 * Converts a floating-point major value (e.g. 100.50) into a strict minor-unit Money object.
 * Applies a 2-decimal rounding to prevent floating-point parse errors.
 * @param {number} majorDecimal
 * @returns {import("../domain/money.js").Money}
 */
export function toMinor(majorDecimal) {
  const numValue = Number(majorDecimal);
  if (!Number.isFinite(numValue)) return createMoney(0, ASSUMED_CURRENCY);
  // Strip floating point noise (e.g., 0.1+0.2 = 0.30000000000000004 -> "0.30")
  const safeStr = numValue.toFixed(2);
  return parseMoneyInput(safeStr, ASSUMED_CURRENCY);
}

/**
 * Converts a strict Money object back to a major decimal.
 * @param {import("../domain/money.js").Money} moneyObj
 * @returns {number}
 */
export function toMajor(moneyObj) {
  // USD has 2 fraction digits.
  return moneyObj.amountMinor / 100;
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
