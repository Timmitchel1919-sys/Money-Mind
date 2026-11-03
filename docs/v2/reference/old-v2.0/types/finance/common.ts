export type EntityId = string;
export type UserId = string;
export type BusinessDate = string;
export type DomainTimestamp = Date;
export type BasisPoints = number;
export interface OwnedEntity { id: EntityId; userId: UserId; createdAt: DomainTimestamp; updatedAt: DomainTimestamp; }
