import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore"

import { db } from "../firebase"

export async function loadUserCollection(userId, collectionName) {
  const ref = collection(db, "users", userId, collectionName)
  const q = query(ref, orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export async function addUserDocument(userId, collectionName, data) {
  return addDoc(collection(db, "users", userId, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateUserDocument(userId, collectionName, documentId, data) {
  return updateDoc(doc(db, "users", userId, collectionName, documentId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteUserDocument(userId, collectionName, documentId) {
  return deleteDoc(doc(db, "users", userId, collectionName, documentId))
}