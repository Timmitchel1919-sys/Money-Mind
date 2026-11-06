import type { BusinessDate, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
export interface InvestmentHolding extends OwnedEntity { accountId: string; symbol: string; name: string; assetClass: "equity" | "fixed-income" | "fund" | "cash-equivalent" | "commodity" | "crypto" | "other"; quantity: string; costBasisMinor: number | null; costBasisCurrency: CurrencyCode | null; currentPriceMinor: number | null; currentPriceCurrency: CurrencyCode | null; priceAsOf: BusinessDate | null; }
export type CreateInvestmentHoldingInput = Omit<InvestmentHolding, "id" | "userId" | "createdAt" | "updatedAt">;
export type UpdateInvestmentHoldingInput = Partial<Pick<InvestmentHolding, "symbol" | "name" | "assetClass" | "quantity" | "costBasisMinor" | "costBasisCurrency" | "currentPriceMinor" | "currentPriceCurrency" | "priceAsOf">>;
