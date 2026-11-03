import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseClientServices, getFirebaseFirestore } from "@/lib/firebase/client";
import {
  FINANCIAL_PRIORITY_IDS,
  ONBOARDING_VERSION,
  type FinancialPriorityId,
  type OnboardingCompletion,
  type OnboardingProgress,
  type UserProfile,
  type UserProfileUpdate,
} from "@/types/profile";

async function profileReference() {
  const { auth } = getFirebaseClientServices();
  const user = auth.currentUser;
  if (!user) throw new Error("An authenticated user is required.");
  const db = await getFirebaseFirestore();
  return doc(db, "users", user.uid);
}

function validCurrency(value: string) { return /^[A-Z]{3}$/.test(value); }
function validCountry(value: string) { return /^[A-Z]{2}$/.test(value); }
function validTimezone(value: string) {
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return true; }
  catch { return false; }
}
function validPriorities(values: FinancialPriorityId[]) {
  return values.every((value) => FINANCIAL_PRIORITY_IDS.includes(value));
}

export async function ensureUserProfile(user: User): Promise<void> {
  const db = await getFirebaseFirestore();
  const reference = doc(db, "users", user.uid);
  if ((await getDoc(reference)).exists()) return;
  await setDoc(reference, {
    uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL,
    countryCode: null, locale: typeof navigator === "undefined" ? "en" : navigator.language,
    timezone: typeof Intl === "undefined" ? null : Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferredCurrency: null, dateFormat: "locale", numberFormat: "locale", theme: "obsidian",
    financialPriorities: [], accountIntent: null, goalIntent: null, onboardingCompleted: false,
    onboardingStep: 1, onboardingVersion: ONBOARDING_VERSION,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const snapshot = await getDoc(await profileReference());
  return snapshot.exists() ? snapshot.data() as UserProfile : null;
}

export async function updateUserProfile(input: UserProfileUpdate): Promise<void> {
  const update: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (input.displayName !== undefined) {
    const value = input.displayName.trim();
    if (value.length < 2 || value.length > 80) throw new Error("Display name must be between 2 and 80 characters.");
    update.displayName = value;
  }
  if (input.photoURL !== undefined) update.photoURL = input.photoURL;
  if (input.countryCode !== undefined) {
    if (!validCountry(input.countryCode)) throw new Error("Choose a valid country code.");
    update.countryCode = input.countryCode;
  }
  if (input.locale !== undefined) update.locale = input.locale;
  if (input.timezone !== undefined) {
    if (!validTimezone(input.timezone)) throw new Error("Choose a valid timezone.");
    update.timezone = input.timezone;
  }
  if (input.preferredCurrency !== undefined) {
    if (!validCurrency(input.preferredCurrency)) throw new Error("Choose a valid currency.");
    update.preferredCurrency = input.preferredCurrency;
  }
  if (input.dateFormat !== undefined) update.dateFormat = input.dateFormat;
  if (input.numberFormat !== undefined) update.numberFormat = input.numberFormat;
  await updateDoc(await profileReference(), update);
}

export async function updateOnboardingProgress(progress: OnboardingProgress): Promise<void> {
  if (progress.onboardingStep < 1 || progress.onboardingStep > 7) throw new Error("Invalid onboarding step.");
  const update: Record<string, unknown> = {
    onboardingStep: progress.onboardingStep,
    onboardingVersion: ONBOARDING_VERSION,
    updatedAt: serverTimestamp(),
  };
  if (progress.preferredCurrency !== undefined) {
    if (!validCurrency(progress.preferredCurrency)) throw new Error("Choose a valid currency.");
    update.preferredCurrency = progress.preferredCurrency;
  }
  if (progress.countryCode !== undefined) {
    if (!validCountry(progress.countryCode)) throw new Error("Choose a valid country.");
    update.countryCode = progress.countryCode;
  }
  if (progress.locale !== undefined) update.locale = progress.locale;
  if (progress.timezone !== undefined) {
    if (!validTimezone(progress.timezone)) throw new Error("Choose a valid timezone.");
    update.timezone = progress.timezone;
  }
  if (progress.financialPriorities !== undefined) {
    if (!validPriorities(progress.financialPriorities)) throw new Error("Choose valid financial priorities.");
    update.financialPriorities = progress.financialPriorities;
  }
  if (progress.accountIntent !== undefined) update.accountIntent = progress.accountIntent;
  if (progress.goalIntent !== undefined) update.goalIntent = progress.goalIntent;
  await updateDoc(await profileReference(), update);
}

export async function completeOnboarding(values: OnboardingCompletion): Promise<void> {
  await updateOnboardingProgress(values);
  await updateDoc(await profileReference(), {
    onboardingCompleted: true, onboardingStep: 7, onboardingVersion: ONBOARDING_VERSION,
    updatedAt: serverTimestamp(),
  });
}
