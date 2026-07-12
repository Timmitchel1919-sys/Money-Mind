import { useState } from "react"
import {
  getUserCollection,
  addUserDocument,
  updateUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useMoneyMindData(user) {
  const [budgets, setBudgets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [assets, setAssets] = useState([])
  const [liabilities, setLiabilities] = useState([])
  const [goals, setGoals] = useState([])
  const [debts, setDebts] = useState([])

  async function loadAllData(userId) {
    const [
      budgetsData,
      transactionsData,
      assetsData,
      liabilitiesData,
      goalsData,
      debtsData,
    ] = await Promise.all([
      getUserCollection(userId, "budgets"),
      getUserCollection(userId, "transactions"),
      getUserCollection(userId, "assets"),
      getUserCollection(userId, "liabilities"),
      getUserCollection(userId, "goals"),
      getUserCollection(userId, "debts"),
    ])

    setBudgets(budgetsData)
    setTransactions(transactionsData)
    setAssets(assetsData)
    setLiabilities(liabilitiesData)
    setGoals(goalsData)
    setDebts(debtsData)
  }

  async function addItem(collectionName, data) {
    if (!user) return
    await addUserDocument(user.uid, collectionName, data)
    await loadAllData(user.uid)
  }

  async function updateItem(collectionName, id, data) {
    if (!user) return
    await updateUserDocument(user.uid, collectionName, id, data)
    await loadAllData(user.uid)
  }

  async function deleteItem(collectionName, id) {
    if (!user) return
    await deleteUserDocument(user.uid, collectionName, id)
    await loadAllData(user.uid)
  }

  return {
    budgets,
    transactions,
    assets,
    liabilities,
    goals,
    debts,
    loadAllData,
    addItem,
    updateItem,
    deleteItem,
  }
}