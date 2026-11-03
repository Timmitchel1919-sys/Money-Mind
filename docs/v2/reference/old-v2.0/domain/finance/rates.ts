import { DomainValidationError } from "./errors.ts";
import type { BasisPoints } from "@/types/finance";
export function createBasisPoints(value: number, options: { allowNegative?: boolean; maximum?: number } = {}): BasisPoints {
  if (!Number.isSafeInteger(value)) throw new DomainValidationError("Basis points must be a safe integer.");
  if (!options.allowNegative && value < 0) throw new DomainValidationError("Basis points cannot be negative.");
  if (options.maximum !== undefined && value > options.maximum) throw new DomainValidationError("Basis points exceed the allowed maximum.");
  return value;
}
