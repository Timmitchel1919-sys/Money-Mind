import type { BusinessDate, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
import type { RecurrenceFrequency } from "./bill";
import type { TransactionType } from "./transaction";
export interface RecurringTransaction extends OwnedEntity { type: TransactionType; accountId: string; categoryId: string | null; amountMinor: number; currency: CurrencyCode; frequency: RecurrenceFrequency; startDate: BusinessDate; nextDate: BusinessDate; status: "active" | "paused" | "ended"; merchant: string | null; description: string | null; }
export type CreateRecurringTransactionInput = Omit<RecurringTransaction, "id" | "userId" | "createdAt" | "updatedAt">;
export type UpdateRecurringTransactionInput = Partial<Pick<RecurringTransaction, "categoryId" | "amountMinor" | "frequency" | "nextDate" | "status" | "merchant" | "description">>;
