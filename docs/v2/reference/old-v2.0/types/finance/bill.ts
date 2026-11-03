import type { BusinessDate, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
export const RECURRENCE_FREQUENCIES = ["weekly", "biweekly", "monthly", "quarterly", "yearly", "custom"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];
export interface Bill extends OwnedEntity { name: string; amountMinor: number; currency: CurrencyCode; categoryId: string | null; accountId: string | null; dueDate: BusinessDate; frequency: RecurrenceFrequency; autopay: boolean; status: "active" | "inactive" | "archived"; notes: string | null; }
export type CreateBillInput = Omit<Bill, "id" | "userId" | "createdAt" | "updatedAt">;
export type UpdateBillInput = Partial<Omit<CreateBillInput, "currency">>;
