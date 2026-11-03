import type { BusinessDate, DomainTimestamp, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export const TRANSACTION_STATUSES = ["pending", "posted", "voided"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type TransferDirection = "transfer-in" | "transfer-out";
export interface Transaction extends OwnedEntity { accountId: string; type: TransactionType; amountMinor: number; currency: CurrencyCode; categoryId: string | null; merchant: string | null; description: string | null; transactionDate: BusinessDate; postedDate: BusinessDate | null; status: TransactionStatus; notes: string | null; tags: string[]; transferId: string | null; transferDirection: TransferDirection | null; voidedAt: DomainTimestamp | null; }
export interface SameCurrencyTransferInput { sourceAccountId: string; destinationAccountId: string; amountMinor: number; currency: CurrencyCode; transactionDate: BusinessDate; }
export interface CrossCurrencyTransferInput { sourceAccountId: string; destinationAccountId: string; sourceAmountMinor: number; sourceCurrency: CurrencyCode; destinationAmountMinor: number; destinationCurrency: CurrencyCode; exchangeRate: { numerator: string; denominator: string; provider: string | null; quotedAt: DomainTimestamp | null }; transactionDate: BusinessDate; }
export type CreateTransactionInput = Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt" | "voidedAt">;
export type UpdateTransactionInput = Partial<Pick<Transaction, "categoryId" | "merchant" | "description" | "transactionDate" | "postedDate" | "status" | "notes" | "tags">>;
