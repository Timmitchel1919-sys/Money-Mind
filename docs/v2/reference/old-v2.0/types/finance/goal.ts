import type { BusinessDate, DomainTimestamp, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
export const GOAL_TYPES = ["emergency-fund", "purchase", "home", "education", "travel", "investment", "debt-payoff", "custom"] as const;
export type GoalType = (typeof GOAL_TYPES)[number];
export interface Goal extends OwnedEntity { name: string; type: GoalType; targetAmountMinor: number; currency: CurrencyCode; targetDate: BusinessDate | null; priority: "low" | "medium" | "high"; status: "active" | "completed" | "archived"; linkedAccountIds: string[]; archivedAt: DomainTimestamp | null; }
export interface GoalContribution { id: string; userId: string; goalId: string; amountMinor: number; currency: CurrencyCode; date: BusinessDate; sourceAccountId: string | null; linkedTransactionId: string | null; notes: string | null; createdAt: DomainTimestamp; }
export type CreateGoalInput = Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt" | "archivedAt">;
export type UpdateGoalInput = Partial<Pick<Goal, "name" | "targetAmountMinor" | "targetDate" | "priority" | "status" | "linkedAccountIds">>;
export type CreateGoalContributionInput = Omit<GoalContribution, "id" | "userId" | "createdAt">;
