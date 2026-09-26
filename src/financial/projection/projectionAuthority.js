// Production projection authority.
//
// The minor-unit engine (projectFinancialsMinor.js) is the financial authority for
// the V2 simulation projection. The legacy floating-point engine (projectFinancials.js)
// is kept only as a comparison reference (parity suite) and as an explicit, flagged
// fallback for inputs the minor-unit domain rejects (e.g. amounts beyond the safe
// integer range, or a currency code the domain cannot resolve). A fallback is never
// silent: the result carries `authority` and `fallbackReason`.

import { projectFinancials as legacyProjectFinancials } from "./projectFinancials.js";
import { minorUnitProjectFinancials } from "./projectFinancialsMinor.js";
import { DomainValidationError } from "../domain/errors.js";

export const PROJECTION_AUTHORITY = "minor-unit";
export const LEGACY_FALLBACK = "legacy-fallback";

/**
 * Runs the authoritative projection.
 *
 * @param {import("./projectFinancials.js").FinancialSnapshot} snapshot  Amounts in `currencyCode`.
 * @param {import("./projectFinancials.js").SimulationLevers} levers     Amounts in `currencyCode`.
 * @param {{ currencyCode: string }} context  Explicit currency the figures are denominated in.
 * @returns {ReturnType<typeof minorUnitProjectFinancials> & { authority: string, fallbackReason: string | null }}
 */
export function runFinancialProjection(snapshot, levers, context) {
  try {
    return { ...minorUnitProjectFinancials(snapshot, levers, context), authority: PROJECTION_AUTHORITY, fallbackReason: null };
  } catch (error) {
    if (!(error instanceof DomainValidationError)) throw error;
    const legacy = legacyProjectFinancials(snapshot, levers);
    return { ...legacy, currencyCode: context?.currencyCode ?? null, authority: LEGACY_FALLBACK, fallbackReason: `${error.name}: ${error.message}` };
  }
}
