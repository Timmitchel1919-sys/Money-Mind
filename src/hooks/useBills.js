import { useState } from "react"
import {
  loadUserCollection,
  addUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useBills() {
  const [bills, setBills] = useState([])

  async function loadBills(userId) {
    const data = await loadUserCollection(userId, "bills")
    setBills(data)
  }

  async function addBill(userId, bill) {
    await addUserDocument(userId, "bills", bill)
    await loadBills(userId)
  }

  async function deleteBill(userId, id) {
    await deleteUserDocument(userId, "bills", id)
    await loadBills(userId)
  }

  return {
    bills,
    loadBills,
    addBill,
    deleteBill,
  }
}