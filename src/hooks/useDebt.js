import { useState } from "react"
import {
  loadUserCollection,
  addUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useDebt() {
  const [debts, setDebts] = useState([])

  async function loadDebts(userId) {
    const data = await loadUserCollection(userId, "debts")
    setDebts(data)
  }

  async function addDebt(userId, debt) {
    await addUserDocument(userId, "debts", debt)
    await loadDebts(userId)
  }

  async function deleteDebt(userId, id) {
    await deleteUserDocument(userId, "debts", id)
    await loadDebts(userId)
  }

  return {
    debts,
    loadDebts,
    addDebt,
    deleteDebt,
  }
}