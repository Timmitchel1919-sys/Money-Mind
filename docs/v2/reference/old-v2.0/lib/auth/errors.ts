import { FirebaseError } from "firebase/app";

const messages:Record<string,string>={
  "auth/invalid-credential":"Incorrect email or password.",
  "auth/user-not-found":"Incorrect email or password.",
  "auth/wrong-password":"Incorrect email or password.",
  "auth/email-already-in-use":"An account already exists with this email.",
  "auth/invalid-email":"Enter a valid email address.",
  "auth/weak-password":"Choose a stronger password that meets the listed requirements.",
  "auth/too-many-requests":"Too many attempts. Try again later.",
  "auth/popup-closed-by-user":"Google sign-in was cancelled.",
  "auth/popup-blocked":"Your browser blocked the Google sign-in window. Allow popups and try again.",
  "auth/network-request-failed":"Check your connection and try again.",
  "auth/requires-recent-login":"Sign in again before making this security change.",
};

export function mapAuthError(error:unknown):string {
  if(error instanceof FirebaseError)return messages[error.code]??"Authentication could not be completed. Please try again.";
  if(error instanceof Error&&error.message.includes("not configured"))return "Authentication is unavailable because Firebase is not configured.";
  return "Authentication could not be completed. Please try again.";
}
