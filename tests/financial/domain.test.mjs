import assert from "node:assert/strict";

import { 
  addMoney, 
  compareMoney, 
  createBasisPoints, 
  createBusinessDate, 
  createMoney, 
  currencyFractionDigits, 
  formatMoney, 
  isExpenseType, 
  isIncomeType, 
  parseMoneyInput, 
  subtractMoney, 
  validateAccount, 
  validateAsset, 
  validateCrossCurrencyTransfer, 
  validateDebt, 
  validateGoal, 
  validateInvestmentQuantity, 
  validateSameCurrencyTransfer, 
  validateTransaction 
} from "../../src/financial/domain/index.js";

function rejects(run, label) { assert.throws(run, undefined, label); }

assert.deepEqual(createMoney(0, "usd"), { amountMinor: 0, currency: "USD" });
assert.equal(createMoney(Number.MAX_SAFE_INTEGER, "USD").amountMinor, Number.MAX_SAFE_INTEGER);
rejects(() => createMoney(Number.MAX_SAFE_INTEGER + 1, "USD"), "unsafe money");

assert.equal(currencyFractionDigits("JPY"), 0);
assert.equal(currencyFractionDigits("USD"), 2);
assert.equal(currencyFractionDigits("BHD"), 3);
rejects(() => currencyFractionDigits("ZZZ"), "unsupported currency");

assert.deepEqual(parseMoneyInput("  +10.25 ", "USD"), { amountMinor: 1025, currency: "USD" });
assert.deepEqual(parseMoneyInput("-0.99", "USD"), { amountMinor: -99, currency: "USD" });
assert.equal(parseMoneyInput("10", "JPY").amountMinor, 10);
assert.equal(parseMoneyInput("1.234", "BHD").amountMinor, 1234);

for (const malformed of ["", "1.234", "1e3", "1,000", ".50", "abc"]) {
  rejects(() => parseMoneyInput(malformed, "USD"), malformed);
}

assert.equal(addMoney(createMoney(100, "USD"), createMoney(25, "USD")).amountMinor, 125);
assert.equal(subtractMoney(createMoney(100, "USD"), createMoney(125, "USD")).amountMinor, -25);
assert.equal(compareMoney(createMoney(1, "USD"), createMoney(2, "USD")), -1);
rejects(() => addMoney(createMoney(1, "USD"), createMoney(1, "EUR")), "currency mismatch");
assert.match(formatMoney(createMoney(125050, "USD"), "en-US"), /1,250\.50/);

assert.equal(createBasisPoints(0), 0);
assert.equal(createBasisPoints(525), 525);
assert.equal(createBasisPoints(100_000, { maximum: 100_000 }), 100_000);
for (const invalid of [5.25, -1, Number.MAX_SAFE_INTEGER + 1]) {
  rejects(() => createBasisPoints(invalid), "invalid bps");
}

assert.equal(createBusinessDate("2026-02-28"), "2026-02-28");
for (const invalid of ["2026-02-30", "not-a-date", "2026-2-01"]) {
  rejects(() => createBusinessDate(invalid), invalid);
}

for (const value of ["1", "1.5", "0.000001", "12.345678"]) {
  assert.equal(validateInvestmentQuantity(value), value);
}

for (const value of ["NaN", "1e5", "abc", "-1", ".5"]) {
  rejects(() => validateInvestmentQuantity(value), value);
}

const transfer = { 
  sourceAccountId: "account-1", 
  destinationAccountId: "account-2", 
  amountMinor: 1000, 
  currency: "USD", 
  transactionDate: "2026-01-15" 
};
assert.deepEqual(validateSameCurrencyTransfer(transfer), transfer);
rejects(() => validateSameCurrencyTransfer({ ...transfer, sourceAccountId: "account-2" }), "same account");
rejects(() => validateSameCurrencyTransfer({ ...transfer, sourceAccountId: "" }), "missing source");
rejects(() => validateSameCurrencyTransfer({ ...transfer, destinationAccountId: "" }), "missing destination");
rejects(() => validateSameCurrencyTransfer({ ...transfer, amountMinor: 0 }), "zero transfer");
rejects(() => validateSameCurrencyTransfer({ ...transfer, amountMinor: -1 }), "negative transfer");
assert.equal(isIncomeType("transfer"), false);
assert.equal(isExpenseType("transfer"), false);
assert.equal(validateCrossCurrencyTransfer({ 
  sourceAccountId: "a", 
  destinationAccountId: "b", 
  sourceAmountMinor: 100, 
  sourceCurrency: "USD", 
  destinationAmountMinor: 90, 
  destinationCurrency: "EUR", 
  exchangeRate: { numerator: "9", denominator: "10", provider: null, quotedAt: null }, 
  transactionDate: "2026-01-15" 
}).destinationCurrency, "EUR");

rejects(() => validateCrossCurrencyTransfer({ 
  sourceAccountId: "a", 
  destinationAccountId: "b", 
  sourceAmountMinor: 100, 
  sourceCurrency: "USD", 
  destinationAmountMinor: 100, 
  destinationCurrency: "USD", 
  exchangeRate: { numerator: "1", denominator: "1", provider: null, quotedAt: null }, 
  transactionDate: "2026-01-15" 
}), "same currency cross contract");

// Fixtures for testing validation
const now = "2026-01-15T12:00:00.000Z";
const accountFixture = (overrides = {}) => ({ id: "account-1", userId: "user-fixture", name: "Primary checking", institutionName: "Example Bank", type: "checking", currency: "USD", openingBalanceMinor: 10000, status: "active", includeInNetWorth: true, lastFour: "1234", creditLimitMinor: null, interestRateBps: null, notes: null, createdAt: now, updatedAt: now, archivedAt: null, ...overrides });
const transactionFixture = (overrides = {}) => ({ id: "transaction-1", userId: "user-fixture", accountId: "account-1", type: "expense", amountMinor: 2500, currency: "USD", categoryId: "food", merchant: "Example Merchant", description: null, transactionDate: "2026-01-15", postedDate: "2026-01-16", status: "posted", notes: null, tags: [], transferId: null, transferDirection: null, createdAt: now, updatedAt: now, voidedAt: null, ...overrides });
const goalFixture = (overrides = {}) => ({ id: "goal-1", userId: "user-fixture", name: "Emergency fund", type: "emergency-fund", targetAmountMinor: 500000, currency: "USD", targetDate: null, priority: "high", status: "active", linkedAccountIds: [], createdAt: now, updatedAt: now, archivedAt: null, ...overrides });
const debtFixture = (overrides = {}) => ({ id: "debt-1", userId: "user-fixture", name: "Example loan", lender: "Example Lender", type: "personal-loan", currency: "USD", currentBalanceMinor: 400000, originalBalanceMinor: 500000, interestRateBps: 525, minimumPaymentMinor: 15000, dueDay: 15, termMonths: 48, status: "active", linkedAccountId: null, createdAt: now, updatedAt: now, closedAt: null, ...overrides });
const assetFixture = (overrides = {}) => ({ id: "asset-1", userId: "user-fixture", name: "Example vehicle", type: "vehicle", currency: "USD", currentValueMinor: 2000000, includeInNetWorth: true, valuationDate: "2026-01-15", notes: null, createdAt: now, updatedAt: now, archivedAt: null, ...overrides });

assert.equal(validateAccount(accountFixture()).type, "checking");
rejects(() => validateAccount(accountFixture({ type: "invalid" })), "invalid account type");
rejects(() => validateAccount(accountFixture({ currency: "US" })), "bad currency");
rejects(() => validateAccount(accountFixture({ openingBalanceMinor: Number.MAX_SAFE_INTEGER + 1 })), "unsafe balance");
rejects(() => validateAccount(accountFixture({ interestRateBps: 5.5 })), "bad rate");
rejects(() => validateAccount(accountFixture({ status: "invalid" })), "bad status");
rejects(() => validateAccount(accountFixture({ lastFour: "12A4" })), "bad last four");

assert.equal(validateTransaction(transactionFixture()).type, "expense");
rejects(() => validateTransaction(transactionFixture({ amountMinor: -10 })), "negative magnitude");
rejects(() => validateTransaction(transactionFixture({ accountId: "" })), "empty account");
rejects(() => validateTransaction(transactionFixture({ type: "transfer" })), "transfer linkage");

assert.equal(validateGoal(goalFixture()).type, "emergency-fund");
rejects(() => validateGoal(goalFixture({ targetAmountMinor: 0 })), "non-positive goal");

assert.equal(validateDebt(debtFixture()).interestRateBps, 525);
rejects(() => validateDebt(debtFixture({ dueDay: 32 })), "invalid due day");

assert.equal(validateAsset(assetFixture()).type, "vehicle");
rejects(() => validateAsset(assetFixture({ currentValueMinor: -1 })), "negative asset value");

console.log("Financial domain tests passed.");
