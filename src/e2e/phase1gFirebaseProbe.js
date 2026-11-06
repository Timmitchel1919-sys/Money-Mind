import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { httpsCallable } from "firebase/functions"
import { auth, db, firebaseRuntime, functions } from "../firebase"

const expectedProjectId = "demo-money-mind-e2e"

function assertIsolatedRuntime() {
  if (!firebaseRuntime.emulatorMode || firebaseRuntime.projectId !== expectedProjectId || db.app.options.projectId !== expectedProjectId) {
    throw new Error("Phase 1G probe refused a non-isolated Firebase runtime.")
  }
}

function evidenceRef({ documentId, uid }) {
  assertIsolatedRuntime()
  return doc(db, "users", uid, "e2eEvidence", documentId)
}

export async function writeEvidence(values) {
  await setDoc(evidenceRef(values), values.data)
  return { projectId: db.app.options.projectId, uid: auth.currentUser?.uid }
}

export async function readEvidence(values) {
  const snapshot = await getDoc(evidenceRef(values))
  return { data: snapshot.data() ?? null, exists: snapshot.exists() }
}

export async function deleteEvidence(values) {
  await deleteDoc(evidenceRef(values))
  return { deleted: true }
}

export async function expectEvidenceDenied(values, operation) {
  try {
    if (operation === "read") await getDoc(evidenceRef(values))
    else await setDoc(evidenceRef(values), values.data)
    return { code: null, denied: false }
  } catch (error) {
    return {
      code: error?.code ?? String(error),
      denied: ["permission-denied", "firestore/permission-denied"].includes(error?.code),
    }
  }
}

export async function signOutForRulesProbe() {
  assertIsolatedRuntime()
  await signOut(auth)
  return { signedOut: !auth.currentUser }
}

export async function probeFunctionsLoopback() {
  assertIsolatedRuntime()
  const callable = httpsCallable(functions, "phase1gLoopbackProbe")
  try {
    await Promise.race([
      callable({ synthetic: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Local Functions probe timed out")), 5_000)),
    ])
    return { failedLocally: false }
  } catch (error) {
    return { code: error?.code ?? String(error), failedLocally: true }
  }
}
