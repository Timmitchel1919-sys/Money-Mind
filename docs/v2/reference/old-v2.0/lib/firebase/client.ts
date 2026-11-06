import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirebaseClientConfig } from "@/lib/firebase/config";

export interface FirebaseClientServices { firebaseApp: FirebaseApp; auth: Auth; }
let services: FirebaseClientServices | undefined;
let firestore: Firestore | undefined;

export function getFirebaseClientServices(): FirebaseClientServices {
  if (services) return services;
  const firebaseApp=getApps().length>0?getApp():initializeApp(getFirebaseClientConfig());
  services={firebaseApp,auth:getAuth(firebaseApp)};
  return services;
}

export async function getFirebaseFirestore(): Promise<Firestore> {
  if (firestore) return firestore;
  const { getFirestore } = await import("firebase/firestore");
  firestore = getFirestore(getFirebaseClientServices().firebaseApp);
  return firestore;
}
