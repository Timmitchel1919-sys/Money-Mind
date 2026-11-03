import type { FirebaseOptions } from "firebase/app";

const publicFirebaseEnvironment = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

export const isFirebaseConfigured = Object.values(publicFirebaseEnvironment).every((value) => Boolean(value));

export function getFirebaseClientConfig(): FirebaseOptions {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase authentication is not configured for this environment.");
  }
  return publicFirebaseEnvironment as FirebaseOptions;
}
