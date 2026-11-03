import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, reload, sendEmailVerification as firebaseSendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User } from "firebase/auth";
import { getFirebaseClientServices } from "@/lib/firebase/client";
import type { LoginInput, RegisterInput } from "@/types/auth";

async function ensureProfile(user: User) {
  const { ensureUserProfile } = await import("@/services/users/user-profile-service");
  await ensureUserProfile(user);
}

export function observeAuthState(onUser:(user:User|null)=>void,onError:(error:Error)=>void){return onAuthStateChanged(getFirebaseClientServices().auth,onUser,onError);}
export async function registerWithEmail(input:RegisterInput){const {auth}=getFirebaseClientServices();const credential=await createUserWithEmailAndPassword(auth,input.email.trim(),input.password);await updateProfile(credential.user,{displayName:input.fullName.trim()});await Promise.all([ensureProfile(credential.user),firebaseSendEmailVerification(credential.user)]);return credential.user;}
export async function loginWithEmail(input:LoginInput){const credential=await signInWithEmailAndPassword(getFirebaseClientServices().auth,input.email.trim(),input.password);await ensureProfile(credential.user);return credential.user;}
export async function loginWithGoogle(){const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});const credential=await signInWithPopup(getFirebaseClientServices().auth,provider);await ensureProfile(credential.user);return credential.user;}
export async function logout(){await signOut(getFirebaseClientServices().auth);}
export async function sendPasswordReset(email:string){await sendPasswordResetEmail(getFirebaseClientServices().auth,email.trim());}
export async function sendVerificationEmail(user:User){await firebaseSendEmailVerification(user);}
export async function refreshCurrentUser(){const user=getFirebaseClientServices().auth.currentUser;if(!user)return null;await reload(user);return getFirebaseClientServices().auth.currentUser;}
export function getCurrentFirebaseUser(){return getFirebaseClientServices().auth.currentUser;}
