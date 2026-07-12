import { useState } from "react"
import {
  loadUserCollection,
  addUserDocument,
  updateUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useInvestments() {
  const [investments, setInvestments] = useState([])

  async function loadInvestments(userId) {
    const data = await loadUserCollection(userId, "investments")
    setInvestments(data)
  }

  async function addInvestment(userId, investment) {
    await addUserDocument(userId, "investments", investment)
    await loadInvestments(userId)
  }

  async function updateInvestment(userId, id, investment) {
    await updateUserDocument(userId, "investments", id, investment)
    await loadInvestments(userId)
  }

  async function deleteInvestment(userId, id) {
    await deleteUserDocument(userId, "investments", id)
    await loadInvestments(userId)
  }

  return {
    investments,
    loadInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
  }
}