import { initializeApp } from "firebase/app"
import { connectAuthEmulator, getAuth } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore"
import { connectFunctionsEmulator, getFunctions } from "firebase/functions"
import { FIREBASE_EMULATOR_PROJECT_ID, resolveFirebaseRuntimeConfig } from "./core/firebase/runtimeConfig"

const firebaseRuntime = resolveFirebaseRuntimeConfig(import.meta.env)
const useEmulators = firebaseRuntime.emulatorMode
const firebaseProjectId = firebaseRuntime.projectId

const firebaseConfig = useEmulators
  ? {
      apiKey: "demo-money-mind-e2e-api-key",
      authDomain: "127.0.0.1",
      projectId: FIREBASE_EMULATOR_PROJECT_ID,
      storageBucket: `${FIREBASE_EMULATOR_PROJECT_ID}.appspot.com`,
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:demo-money-mind-e2e",
    }
  : {
      apiKey: "AIzaSyDAJiNPRUrIlxG3OUah1VGP42f823en8CM",
      authDomain: "money-mind-90176.firebaseapp.com",
      projectId: firebaseProjectId,
      storageBucket: "money-mind-90176.firebasestorage.app",
      messagingSenderId: "754888879912",
      appId: "1:754888879912:web:7b57cac57f9b9c05216a1d",
    }

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
  connectFirestoreEmulator(db, "127.0.0.1", 8080)
  // Callable traffic also stays on loopback. If the Functions emulator is not
  // running, calls fail locally instead of falling through to production.
  connectFunctionsEmulator(functions, "127.0.0.1", 5001)
}

export { firebaseRuntime }
