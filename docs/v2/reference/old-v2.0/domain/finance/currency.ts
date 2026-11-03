import { DomainValidationError } from "./errors.ts";
import type { CurrencyCode } from "@/types/finance";

const precisionCache = new Map<string, number>();
const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"));

export function normalizeCurrencyCode(value: string): CurrencyCode {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new DomainValidationError("Currency must be a three-letter ISO-style code.");
  currencyFractionDigits(code);
  return code;
}

export function currencyFractionDigits(value: string): number {
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
