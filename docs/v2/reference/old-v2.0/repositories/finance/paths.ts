import { DomainValidationError } from "../../domain/finance/errors.ts";

export const FINANCIAL_COLLECTIONS = {
  accounts: "accounts", transactions: "transactions", categories: "categories", budgets: "budgets",
  bills: "bills", goals: "goals", goalContributions: "goalContributions", debts: "debts",
  debtPayments: "debtPayments", assets: "assets", holdings: "holdings",
  recurringTransactions: "recurringTransactions", financialHealthSnapshots: "financialHealthSnapshots",
  aiInsights: "aiInsights",
} as const;
export type FinancialCollection = keyof typeof FINANCIAL_COLLECTIONS;
export function userFinancialCollectionPath(authenticatedUid: string, collection: FinancialCollection): string {
  if (!authenticatedUid.trim() || authenticatedUid.includes("/")) throw new DomainValidationError("A valid authenticated UID is required.");
  return `users/${authenticatedUid}/${FINANCIAL_COLLECTIONS[collection]}`;
}
