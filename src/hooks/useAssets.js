import { useState } from "react"
import {
  loadUserCollection,
  addUserDocument,
  deleteUserDocument,
} from "../services/firestoreService"

export default function useAssets() {
  const [assets, setAssets] = useState([])
  const [liabilities, setLiabilities] = useState([])

  async function loadAssets(userId) {
    const data = await loadUserCollection(userId, "assets")
    setAssets(data)
  }

  async function loadLiabilities(userId) {
    const data = await loadUserCollection(userId, "liabilities")
    setLiabilities(data)
  }

  async function addAsset(userId, asset) {
    await addUserDocument(userId, "assets", asset)
    await loadAssets(userId)
  }

  async function addLiability(userId, liability) {
    await addUserDocument(userId, "liabilities", liability)
    await loadLiabilities(userId)
  }

  async function deleteAsset(userId, id) {
    await deleteUserDocument(userId, "assets", id)
    await loadAssets(userId)
  }

  async function deleteLiability(userId, id) {
    await deleteUserDocument(userId, "liabilities", id)
    await loadLiabilities(userId)
  }

  return {
    assets,
    liabilities,
    loadAssets,
    loadLiabilities,
    addAsset,
    addLiability,
    deleteAsset,
    deleteLiability,
  }
}