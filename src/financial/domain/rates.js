import { DomainValidationError } from "./errors.js";

/** @typedef {number} BasisPoints */

/**
 * Creates and validates a basis points representation (1 basis point = 0.01%).
 * Ensures the rate is represented as a safe integer.
 * @param {number} value 
 * @param {{ allowNegative?: boolean; maximum?: number }} [options]
 * @returns {BasisPoints}
 */
export function createBasisPoints(value, options = {}) {
  if (!Number.isSafeInteger(value)) {
    throw new DomainValidationError("Basis points must be a safe integer.");
  }
  if (!options.allowNegative && value < 0) {
    throw new DomainValidationError("Basis points cannot be negative.");
  }
  if (options.maximum !== undefined && value > options.maximum) {
    throw new DomainValidationError("Basis points exceed the allowed maximum.");
  }
  return value;
}
