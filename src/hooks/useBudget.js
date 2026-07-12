import { useState } from "react"
import {
  loadUserCollection,
  addUserDocument,
  updateUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useBudget() {
  const [budgets, setBudgets] = useState([])

  async function loadBudgets(userId) {
    const data = await loadUserCollection(userId, "budgets")
    setBudgets(data)
  }

  async function addBudget(userId, budget) {
    await addUserDocument(userId, "budgets", budget)
    await loadBudgets(userId)
  }

  async function updateBudget(userId, id, budget) {
    await updateUserDocument(userId, "budgets", id, budget)
    await loadBudgets(userId)
  }

  async function deleteBudget(userId, id) {
    await deleteUserDocument(userId, "budgets", id)
    await loadBudgets(userId)
  }

  return {
    budgets,
    loadBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
  }
}