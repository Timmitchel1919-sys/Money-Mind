import { DomainValidationError } from "./errors.js";

/** @typedef {string} BusinessDate - Format YYYY-MM-DD */

/**
 * Validates and normalizes a BusinessDate string.
 * @param {string} value 
 * @returns {BusinessDate}
 */
export function createBusinessDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new DomainValidationError("Business date must use YYYY-MM-DD.");
  }
  
  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new DomainValidationError("Business date is not a valid calendar date.");
  }
  
  return value;
}
