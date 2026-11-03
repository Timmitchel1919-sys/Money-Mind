import type { DomainTimestamp } from "./common";
export interface AIInsight { id: string; userId: string; type: string; summary: string; relatedEntityIds: string[]; generatedAt: DomainTimestamp; status: "active" | "dismissed" | "superseded"; modelVersion: string; }
