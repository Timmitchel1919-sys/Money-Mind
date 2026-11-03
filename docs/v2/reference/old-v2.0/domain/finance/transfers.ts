import { normalizeCurrencyCode } from "./currency.ts";
import { InvalidTransferError } from "./errors.ts";
import { createBusinessDate } from "./dates.ts";
import type { CrossCurrencyTransferInput, SameCurrencyTransferInput, TransactionType } from "@/types/finance";

function accounts(source: string, destination: string) {
  if (!source.trim()) throw new InvalidTransferError("Source account is required.");
  if (!destination.trim()) throw new InvalidTransferError("Destination account is required.");
  if (source === destination) throw new InvalidTransferError("Source and destination accounts must differ.");
}
function positive(amount: number) { if (!Number.isSafeInteger(amount) || amount <= 0) throw new InvalidTransferError("Transfer amount must be a positive safe integer."); }
export function validateSameCurrencyTransfer(input: SameCurrencyTransferInput): SameCurrencyTransferInput { accounts(input.sourceAccountId, input.destinationAccountId); positive(input.amountMinor); normalizeCurrencyCode(input.currency); createBusinessDate(input.transactionDate); return input; }
export function validateCrossCurrencyTransfer(input: CrossCurrencyTransferInput): CrossCurrencyTransferInput { accounts(input.sourceAccountId, input.destinationAccountId); positive(input.sourceAmountMinor); positive(input.destinationAmountMinor); const source = normalizeCurrencyCode(input.sourceCurrency); const destination = normalizeCurrencyCode(input.destinationCurrency); if (source === destination) throw new InvalidTransferError("Use the same-currency transfer contract when currencies match."); if (!/^\d+$/.test(input.exchangeRate.numerator) || !/^\d+$/.test(input.exchangeRate.denominator) || input.exchangeRate.denominator === "0") throw new InvalidTransferError("Exchange-rate metadata must be an explicit positive rational value."); createBusinessDate(input.transactionDate); return input; }
export function isIncomeType(type: TransactionType) { return type === "income"; }
export function isExpenseType(type: TransactionType) { return type === "expense"; }
