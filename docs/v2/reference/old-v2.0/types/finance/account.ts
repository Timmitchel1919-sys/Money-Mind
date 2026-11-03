import type { BasisPoints, DomainTimestamp, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
export const ACCOUNT_TYPES = ["checking", "savings", "cash", "credit-card", "loan", "investment", "retirement", "property", "business", "other"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export const ACCOUNT_STATUSES = ["active", "archived", "closed"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export interface Account extends OwnedEntity { name: string; institutionName: string | null; type: AccountType; currency: CurrencyCode; openingBalanceMinor: number; status: AccountStatus; includeInNetWorth: boolean; lastFour: string | null; creditLimitMinor: number | null; interestRateBps: BasisPoints | null; notes: string | null; archivedAt: DomainTimestamp | null; }
export type CreateAccountInput = Omit<Account, "id" | "userId" | "createdAt" | "updatedAt" | "archivedAt">;
export type UpdateAccountInput = Partial<Pick<Account, "name" | "institutionName" | "type" | "status" | "includeInNetWorth" | "lastFour" | "creditLimitMinor" | "interestRateBps" | "notes">>;
