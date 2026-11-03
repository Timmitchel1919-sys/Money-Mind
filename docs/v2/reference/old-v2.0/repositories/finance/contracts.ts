import type { Account, Category, CreateAccountInput, CreateCategoryInput, CreateTransactionInput, Debt, Goal, Transaction, UpdateAccountInput, UpdateCategoryInput, UpdateTransactionInput } from "@/types/finance";

export interface AccountRepository { getById(id: string): Promise<Account | null>; list(): Promise<Account[]>; create(input: CreateAccountInput): Promise<Account>; update(id: string, input: UpdateAccountInput): Promise<void>; archive(id: string): Promise<void>; }
export interface TransactionRepository { getById(id: string): Promise<Transaction | null>; list(): Promise<Transaction[]>; create(input: CreateTransactionInput): Promise<Transaction>; update(id: string, input: UpdateTransactionInput): Promise<void>; void(id: string): Promise<void>; }
export interface CategoryRepository { getById(id: string): Promise<Category | null>; list(): Promise<Category[]>; create(input: CreateCategoryInput): Promise<Category>; update(id: string, input: UpdateCategoryInput): Promise<void>; archive(id: string): Promise<void>; }
export interface GoalRepository { getById(id: string): Promise<Goal | null>; list(): Promise<Goal[]>; archive(id: string): Promise<void>; }
export interface DebtRepository { getById(id: string): Promise<Debt | null>; list(): Promise<Debt[]>; close(id: string): Promise<void>; }
