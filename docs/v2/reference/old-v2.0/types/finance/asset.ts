import type { BusinessDate, DomainTimestamp, OwnedEntity } from "./common";
import type { CurrencyCode } from "./money";
export const ASSET_TYPES = ["property", "vehicle", "business", "collectible", "other"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
export interface Asset extends OwnedEntity { name: string; type: AssetType; currency: CurrencyCode; currentValueMinor: number; includeInNetWorth: boolean; valuationDate: BusinessDate; notes: string | null; archivedAt: DomainTimestamp | null; }
export type CreateAssetInput = Omit<Asset, "id" | "userId" | "createdAt" | "updatedAt" | "archivedAt">;
export type UpdateAssetInput = Partial<Pick<Asset, "name" | "currentValueMinor" | "includeInNetWorth" | "valuationDate" | "notes">>;
