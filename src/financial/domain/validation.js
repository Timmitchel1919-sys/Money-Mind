import { createBusinessDate } from "./dates.js";
import { DomainValidationError } from "./errors.js";
import { createBasisPoints } from "./rates.js";
import { normalizeCurrencyCode } from "./currency.js";

// These constant arrays represent expected V2 primitive types for validation.
const ACCOUNT_TYPES = ["checking", "savings", "credit", "investment", "loan"];
const ACCOUNT_STATUSES = ["active", "closed", "frozen"];
const TRANSACTION_TYPES = ["income", "expense", "transfer"];
const TRANSACTION_STATUSES = ["pending", "posted", "voided"];
const CATEGORY_TYPES = ["income", "expense"];
const BUDGET_PERIOD_TYPES = ["monthly", "annual", "custom"];
const RECURRENCE_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "quarterly", "annually"];
const GOAL_TYPES = ["emergency-fund", "savings", "investment", "debt-payoff"];
const DEBT_TYPES = ["credit-card", "personal-loan", "student-loan", "auto-loan", "mortgage"];
const ASSET_TYPES = ["vehicle", "real-estate", "crypto", "custom"];

function nonEmpty(value, field) { 
  if (!value || !value.trim()) throw new DomainValidationError(`${field} is required.`); 
}

function nonNegative(value, field) { 
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new DomainValidationError(`${field} must be a non-negative safe integer.`); 
  }
}

export function validateAccount(account) { 
  nonEmpty(account.id, "Account ID"); 
  nonEmpty(account.userId, "User ID"); 
  nonEmpty(account.name, "Account name"); 
  if (!ACCOUNT_TYPES.includes(account.type)) throw new DomainValidationError("Invalid account type."); 
  if (!ACCOUNT_STATUSES.includes(account.status)) throw new DomainValidationError("Invalid account status."); 
  normalizeCurrencyCode(account.currency); 
  
  if (!Number.isSafeInteger(account.openingBalanceMinor)) {
    throw new DomainValidationError("Opening balance must be a safe integer."); 
  }
  
  if (account.lastFour !== null && account.lastFour !== undefined && !/^\d{4}$/.test(account.lastFour)) {
    throw new DomainValidationError("Last four must contain exactly four digits."); 
  }
  
  if (account.creditLimitMinor !== null && account.creditLimitMinor !== undefined) {
    nonNegative(account.creditLimitMinor, "Credit limit"); 
  }
  
  if (account.interestRateBps !== null && account.interestRateBps !== undefined) {
    createBasisPoints(account.interestRateBps); 
  }
  
  return account; 
}

export function validateTransaction(transaction) { 
  nonEmpty(transaction.id, "Transaction ID"); 
  nonEmpty(transaction.userId, "User ID"); 
  nonEmpty(transaction.accountId, "Account ID"); 
  
  if (!TRANSACTION_TYPES.includes(transaction.type)) throw new DomainValidationError("Invalid transaction type."); 
  if (!TRANSACTION_STATUSES.includes(transaction.status)) throw new DomainValidationError("Invalid transaction status."); 
  
  if (!Number.isSafeInteger(transaction.amountMinor) || transaction.amountMinor <= 0) {
    throw new DomainValidationError("Transaction amount must be a positive safe integer magnitude."); 
  }
  
  normalizeCurrencyCode(transaction.currency); 
  createBusinessDate(transaction.transactionDate); 
  
  if (transaction.postedDate !== null && transaction.postedDate !== undefined) {
    createBusinessDate(transaction.postedDate); 
  }
  
  if (transaction.type === "transfer" && (!transaction.transferId || !transaction.transferDirection)) {
    throw new DomainValidationError("Transfer entries require transfer linkage and direction."); 
  }
  
  if (transaction.type !== "transfer" && (transaction.transferId || transaction.transferDirection)) {
    throw new DomainValidationError("Income and expense entries cannot carry transfer semantics."); 
  }
  
  return transaction; 
}

export function validateInvestmentQuantity(value) { 
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    throw new DomainValidationError("Investment quantity must be a non-negative plain decimal string."); 
  }
  return value; 
}

export function validateDebtPayment(amountMinor, principalMinor, interestMinor) { 
  positiveParts(amountMinor, principalMinor, interestMinor); 
  if (principalMinor + interestMinor > amountMinor) {
    throw new DomainValidationError("Principal and interest cannot exceed the payment amount."); 
  }
}

function positiveParts(...values) { 
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new DomainValidationError("Payment parts must be non-negative safe integers."); 
  }
}

export function validateCategory(value) { 
  nonEmpty(value.name, "Category name"); 
  if (!CATEGORY_TYPES.includes(value.type)) throw new DomainValidationError("Invalid category type."); 
  if (value.parentId === value.id) throw new DomainValidationError("A category cannot be its own parent."); 
  return value; 
}

export function validateGoal(value) { 
  nonEmpty(value.name, "Goal name"); 
  if (!GOAL_TYPES.includes(value.type)) throw new DomainValidationError("Invalid goal type."); 
  
  if (!Number.isSafeInteger(value.targetAmountMinor) || value.targetAmountMinor <= 0) {
    throw new DomainValidationError("Goal target must be positive."); 
  }
  
  normalizeCurrencyCode(value.currency); 
  if (value.targetDate !== null && value.targetDate !== undefined) {
    createBusinessDate(value.targetDate); 
  }
  return value; 
}

export function validateDebt(value) { 
  nonEmpty(value.name, "Debt name"); 
  if (!DEBT_TYPES.includes(value.type)) throw new DomainValidationError("Invalid debt type."); 
  
  normalizeCurrencyCode(value.currency); 
  nonNegative(value.currentBalanceMinor, "Debt balance"); 
  
  if (value.originalBalanceMinor !== null && value.originalBalanceMinor !== undefined) {
    nonNegative(value.originalBalanceMinor, "Original balance"); 
  }
  
  if (value.interestRateBps !== null && value.interestRateBps !== undefined) {
    createBasisPoints(value.interestRateBps); 
  }
  
  if (value.minimumPaymentMinor !== null && value.minimumPaymentMinor !== undefined) {
    nonNegative(value.minimumPaymentMinor, "Minimum payment"); 
  }
  
  if (value.dueDay !== null && value.dueDay !== undefined) {
    if (!Number.isInteger(value.dueDay) || value.dueDay < 1 || value.dueDay > 31) {
      throw new DomainValidationError("Debt due day must be from 1 through 31."); 
    }
  }
  return value; 
}

export function validateAsset(value) { 
  nonEmpty(value.name, "Asset name"); 
  if (!ASSET_TYPES.includes(value.type)) throw new DomainValidationError("Invalid asset type."); 
  normalizeCurrencyCode(value.currency); 
  nonNegative(value.currentValueMinor, "Asset value"); 
  createBusinessDate(value.valuationDate); 
  return value; 
}
