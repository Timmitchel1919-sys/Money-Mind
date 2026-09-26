import { normalizeCurrencyCode } from "./currency.js";
import { InvalidTransferError } from "./errors.js";
import { createBusinessDate } from "./dates.js";

/**
 * @typedef {object} SameCurrencyTransferInput
 * @property {string} sourceAccountId
 * @property {string} destinationAccountId
 * @property {number} amountMinor
 * @property {string} currency
 * @property {string} transactionDate
 */

/**
 * @typedef {object} CrossCurrencyTransferInput
 * @property {string} sourceAccountId
 * @property {string} destinationAccountId
 * @property {number} sourceAmountMinor
 * @property {string} sourceCurrency
 * @property {number} destinationAmountMinor
 * @property {string} destinationCurrency
 * @property {{ numerator: string, denominator: string, provider: string|null, quotedAt: string|null }} exchangeRate
 * @property {string} transactionDate
 */

/**
 * Validates account identifiers differ.
 * @param {string} source 
 * @param {string} destination 
 */
function accounts(source, destination) {
  if (!source || !source.trim()) throw new InvalidTransferError("Source account is required.");
  if (!destination || !destination.trim()) throw new InvalidTransferError("Destination account is required.");
  if (source === destination) throw new InvalidTransferError("Source and destination accounts must differ.");
}

/**
 * Validates amount is a positive safe integer.
 * @param {number} amount 
 */
function positive(amount) { 
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new InvalidTransferError("Transfer amount must be a positive safe integer.");
  }
}

/**
 * @param {SameCurrencyTransferInput} input 
 * @returns {SameCurrencyTransferInput}
 */
export function validateSameCurrencyTransfer(input) { 
  accounts(input.sourceAccountId, input.destinationAccountId); 
  positive(input.amountMinor); 
  normalizeCurrencyCode(input.currency); 
  createBusinessDate(input.transactionDate); 
  return input; 
}

/**
 * @param {CrossCurrencyTransferInput} input 
 * @returns {CrossCurrencyTransferInput}
 */
export function validateCrossCurrencyTransfer(input) { 
  accounts(input.sourceAccountId, input.destinationAccountId); 
  positive(input.sourceAmountMinor); 
  positive(input.destinationAmountMinor); 
  
  const source = normalizeCurrencyCode(input.sourceCurrency); 
  const destination = normalizeCurrencyCode(input.destinationCurrency); 
  
  if (source === destination) {
    throw new InvalidTransferError("Use the same-currency transfer contract when currencies match.");
  }
  
  if (!/^\d+$/.test(input.exchangeRate.numerator) || !/^\d+$/.test(input.exchangeRate.denominator) || input.exchangeRate.denominator === "0") {
    throw new InvalidTransferError("Exchange-rate metadata must be an explicit positive rational value.");
  }
  
  createBusinessDate(input.transactionDate); 
  return input; 
}

/** @param {string} type */
export function isIncomeType(type) { return type === "income"; }

/** @param {string} type */
export function isExpenseType(type) { return type === "expense"; }
