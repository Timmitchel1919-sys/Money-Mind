import { useState } from "react"
import {
  loadUserCollection,
  addUserDocument,
  updateUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useTransactions() {
  const [transactions, setTransactions] = useState([])

  async function loadTransactions(userId) {
    const data = await loadUserCollection(userId, "transactions")
    setTransactions(data)
  }

  async function addTransaction(userId, transaction) {
    await addUserDocument(userId, "transactions", transaction)
    await loadTransactions(userId)
  }

  async function updateTransaction(userId, id, transaction) {
    await updateUserDocument(userId, "transactions", id, transaction)
    await loadTransactions(userId)
  }

  async function deleteTransaction(userId, id) {
    await deleteUserDocument(userId, "transactions", id)
    await loadTransactions(userId)
  }

  return {
    transactions,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  }
}