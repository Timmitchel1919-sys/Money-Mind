import { validateAccount, validateTransaction } from "../../domain/finance/validation.ts";
import type { Account, Transaction } from "@/types/finance";

export interface TimestampValue { toDate(): Date; }
export interface TimestampFactory { fromDate(value: Date): unknown; }
export type DocumentData = Record<string, unknown>;

function record(value: unknown): DocumentData { if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Financial document must be an object."); return value as DocumentData; }
function text(data: DocumentData, key: string): string { const value = data[key]; if (typeof value !== "string") throw new Error(`${key} must be a string.`); return value; }
function nullableText(data: DocumentData, key: string): string | null { const value = data[key]; if (value === null) return null; if (typeof value !== "string") throw new Error(`${key} must be a string or null.`); return value; }
function integer(data: DocumentData, key: string): number { const value = data[key]; if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error(`${key} must be a safe integer.`); return value; }
function nullableInteger(data: DocumentData, key: string): number | null { return data[key] === null ? null : integer(data, key); }
function boolean(data: DocumentData, key: string): boolean { const value = data[key]; if (typeof value !== "boolean") throw new Error(`${key} must be a boolean.`); return value; }
function timestamp(data: DocumentData, key: string): Date { const value = data[key]; if (typeof value !== "object" || value === null || !("toDate" in value) || typeof value.toDate !== "function") throw new Error(`${key} must be a timestamp.`); const result = (value as TimestampValue).toDate(); if (Number.isNaN(result.getTime())) throw new Error(`${key} is invalid.`); return result; }
function nullableTimestamp(data: DocumentData, key: string): Date | null { return data[key] === null ? null : timestamp(data, key); }

export function accountFromDocument(id: string, value: unknown): Account {
  const data = record(value);
  return validateAccount({ id, userId: text(data, "userId"), name: text(data, "name"), institutionName: nullableText(data, "institutionName"), type: text(data, "type") as Account["type"], currency: text(data, "currency"), openingBalanceMinor: integer(data, "openingBalanceMinor"), status: text(data, "status") as Account["status"], includeInNetWorth: boolean(data, "includeInNetWorth"), lastFour: nullableText(data, "lastFour"), creditLimitMinor: nullableInteger(data, "creditLimitMinor"), interestRateBps: nullableInteger(data, "interestRateBps"), notes: nullableText(data, "notes"), createdAt: timestamp(data, "createdAt"), updatedAt: timestamp(data, "updatedAt"), archivedAt: nullableTimestamp(data, "archivedAt") });
}
export function accountToDocument(account: Account, timestamps: TimestampFactory): DocumentData { validateAccount(account); const { id: _id, ...data } = account; void _id; return { ...data, createdAt: timestamps.fromDate(account.createdAt), updatedAt: timestamps.fromDate(account.updatedAt), archivedAt: account.archivedAt ? timestamps.fromDate(account.archivedAt) : null }; }

export function transactionFromDocument(id: string, value: unknown): Transaction {
  const data = record(value); const tags = data.tags; if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) throw new Error("tags must be a string array.");
  return validateTransaction({ id, userId: text(data, "userId"), accountId: text(data, "accountId"), type: text(data, "type") as Transaction["type"], amountMinor: integer(data, "amountMinor"), currency: text(data, "currency"), categoryId: nullableText(data, "categoryId"), merchant: nullableText(data, "merchant"), description: nullableText(data, "description"), transactionDate: text(data, "transactionDate"), postedDate: nullableText(data, "postedDate"), status: text(data, "status") as Transaction["status"], notes: nullableText(data, "notes"), tags, transferId: nullableText(data, "transferId"), transferDirection: nullableText(data, "transferDirection") as Transaction["transferDirection"], createdAt: timestamp(data, "createdAt"), updatedAt: timestamp(data, "updatedAt"), voidedAt: nullableTimestamp(data, "voidedAt") });
}
export function transactionToDocument(transaction: Transaction, timestamps: TimestampFactory): DocumentData { validateTransaction(transaction); const { id: _id, ...data } = transaction; void _id; return { ...data, createdAt: timestamps.fromDate(transaction.createdAt), updatedAt: timestamps.fromDate(transaction.updatedAt), voidedAt: transaction.voidedAt ? timestamps.fromDate(transaction.voidedAt) : null }; }
