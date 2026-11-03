import type { DomainTimestamp, OwnedEntity } from "./common";
export const CATEGORY_TYPES = ["income", "expense"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export interface Category extends OwnedEntity { name: string; type: CategoryType; icon: string | null; colorToken: string | null; parentId: string | null; isSystem: boolean; status: "active" | "archived"; archivedAt: DomainTimestamp | null; }
export type CreateCategoryInput = Omit<Category, "id" | "userId" | "createdAt" | "updatedAt" | "archivedAt">;
export type UpdateCategoryInput = Partial<Pick<Category, "name" | "icon" | "colorToken" | "parentId" | "status">>;
