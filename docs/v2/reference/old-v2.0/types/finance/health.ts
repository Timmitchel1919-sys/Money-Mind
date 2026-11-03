import type { DomainTimestamp } from "./common";
export interface FinancialHealthSnapshot { id: string; userId: string; overallScore: number; liquidityScore: number; savingsScore: number; cashFlowScore: number; debtScore: number; resilienceScore: number; investmentScore: number; calculatedAt: DomainTimestamp; version: number; }
