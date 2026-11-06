import type { BasisPoints, BusinessDate, DomainTimestamp, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
export const DEBT_TYPES = ["credit-card", "personal-loan", "vehicle-loan", "mortgage", "education-loan", "business-debt", "other"] as const;
export type DebtType = (typeof DEBT_TYPES)[number];
export interface Debt extends OwnedEntity { name: string; lender: string | null; type: DebtType; currency: CurrencyCode; currentBalanceMinor: number; originalBalanceMinor: number | null; interestRateBps: BasisPoints | null; minimumPaymentMinor: number | null; dueDay: number | null; termMonths: number | null; status: "active" | "closed"; linkedAccountId: string | null; closedAt: DomainTimestamp | null; }
export interface DebtPayment { id: string; userId: string; debtId: string; amountMinor: number; principalMinor: number; interestMinor: number; date: BusinessDate; linkedTransactionId: string | null; createdAt: DomainTimestamp; }
export type CreateDebtInput = Omit<Debt, "id" | "userId" | "createdAt" | "updatedAt" | "closedAt">;
export type UpdateDebtInput = Partial<Pick<Debt, "name" | "lender" | "currentBalanceMinor" | "interestRateBps" | "minimumPaymentMinor" | "dueDay" | "termMonths" | "status" | "linkedAccountId">>;
export type CreateDebtPaymentInput = Omit<DebtPayment, "id" | "userId" | "createdAt">;
