import { useState } from "react"
import {
  loadUserCollection,
  addUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useSavings() {
  const [savingsPlans, setSavingsPlans] = useState([])

  async function loadSavingsPlans(userId) {
    const data = await loadUserCollection(userId, "savingsPlans")
    setSavingsPlans(data)
  }

  async function addSavingPlan(userId, savingPlan) {
    await addUserDocument(userId, "savingsPlans", savingPlan)
    await loadSavingsPlans(userId)
  }

  async function deleteSavingPlan(userId, id) {
    await deleteUserDocument(userId, "savingsPlans", id)
    await loadSavingsPlans(userId)
  }

  return {
    savingsPlans,
    loadSavingsPlans,
    addSavingPlan,
    deleteSavingPlan,
  }
}