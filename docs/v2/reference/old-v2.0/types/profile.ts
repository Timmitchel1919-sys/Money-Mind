export const ONBOARDING_VERSION=1 as const;
export const FINANCIAL_PRIORITY_IDS=["control-spending","emergency-fund","increase-savings","reduce-debt","invest","build-wealth","organize-finances","financial-awareness","major-purchases"] as const;
export type FinancialPriorityId=(typeof FINANCIAL_PRIORITY_IDS)[number];
export type ThemePreference="obsidian"; export type DateFormat="locale"|"DD/MM/YYYY"|"MM/DD/YYYY"|"YYYY-MM-DD"; export type NumberFormat="locale";
export type AccountIntent="add-later"|"skip"|null; export type GoalIntent="emergency-fund"|"purchase"|"reduce-debt"|"invest"|"build-savings"|"custom"|"skip"|null;
export interface UserProfile {uid:string;email:string|null;displayName:string|null;photoURL:string|null;countryCode:string|null;locale:string;timezone:string|null;preferredCurrency:string|null;dateFormat:DateFormat;numberFormat:NumberFormat;theme:ThemePreference;financialPriorities:FinancialPriorityId[];accountIntent:AccountIntent;goalIntent:GoalIntent;onboardingCompleted:boolean;onboardingStep:number;onboardingVersion:number;createdAt?:unknown;updatedAt?:unknown;}
export interface UserProfileUpdate {displayName?:string;photoURL?:string|null;countryCode?:string;locale?:string;timezone?:string;preferredCurrency?:string;dateFormat?:DateFormat;numberFormat?:NumberFormat;}
export interface OnboardingProgress {onboardingStep:number;preferredCurrency?:string;countryCode?:string;locale?:string;timezone?:string;financialPriorities?:FinancialPriorityId[];accountIntent?:AccountIntent;goalIntent?:GoalIntent;}
export interface OnboardingCompletion extends Omit<OnboardingProgress,"onboardingStep"> {onboardingStep:7;}
