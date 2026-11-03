import type { BusinessDate, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
export const BUDGET_PERIOD_TYPES = ["monthly", "weekly", "custom"] as const;
export type BudgetPeriodType = (typeof BUDGET_PERIOD_TYPES)[number];
export interface Budget extends OwnedEntity { periodType: BudgetPeriodType; periodStart: BusinessDate; periodEnd: BusinessDate; currency: CurrencyCode; status: "draft" | "active" | "closed" | "archived"; }
export interface BudgetItem { id: string; budgetId: string; categoryId: string; plannedAmountMinor: number; }
export type CreateBudgetInput = Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt">;
export type UpdateBudgetInput = Partial<Pick<Budget, "periodType" | "periodStart" | "periodEnd" | "status">>;
