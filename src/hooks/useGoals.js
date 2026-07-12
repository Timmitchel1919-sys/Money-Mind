import { useState } from "react"
import {
  loadUserCollection,
  addUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useGoals() {
  const [goals, setGoals] = useState([])

  async function loadGoals(userId) {
    const data = await loadUserCollection(userId, "goals")
    setGoals(data)
  }

  async function addGoal(userId, goal) {
    await addUserDocument(userId, "goals", goal)
    await loadGoals(userId)
  }

  async function deleteGoal(userId, id) {
    await deleteUserDocument(userId, "goals", id)
    await loadGoals(userId)
  }

  return {
    goals,
    loadGoals,
    addGoal,
    deleteGoal,
  }
}