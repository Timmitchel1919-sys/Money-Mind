import { DomainValidationError } from "./errors.ts";
import type { BusinessDate } from "@/types/finance";
export function createBusinessDate(value: string): BusinessDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new DomainValidationError("Business date must use YYYY-MM-DD.");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new DomainValidationError("Business date is not a valid calendar date.");
  return value;
}
