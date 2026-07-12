import { useEffect, useState } from "react"

export const DEFAULT_KPI_TARGETS = {
  savingsRate: 20,
  expenseRatio: 70,
  cashFlowMargin: 20,
  emergencyFundMonths: 6,
  debtToIncome: 35,
  budgetAdherence: 90,
  savingsGoalProgress: 100,
  investmentReturn: 8,
}

function storageKey(userId) {
  return `money-mind-kpi-targets-${userId || "guest"}`
}

function loadStoredTargets(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return DEFAULT_KPI_TARGETS

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return DEFAULT_KPI_TARGETS

    return { ...DEFAULT_KPI_TARGETS, ...parsed }
  } catch {
    return DEFAULT_KPI_TARGETS
  }
}

// KPI targets are user-editable goals compared against computed KPIs.
// Not persisted to Firestore yet — localStorage only, keyed by UID so
// targets never mix between accounts sharing this browser.
export default function useKPITargets(userId) {
  const [targets, setTargets] = useState(() => loadStoredTargets(userId))

  useEffect(() => {
    setTargets(loadStoredTargets(userId))
  }, [userId])

  function updateTarget(key, value) {
    setTargets((prev) => ({ ...prev, [key]: value }))
  }

  function saveTargets() {
    localStorage.setItem(storageKey(userId), JSON.stringify(targets))
  }

  function resetTargets() {
    setTargets(DEFAULT_KPI_TARGETS)
    localStorage.setItem(storageKey(userId), JSON.stringify(DEFAULT_KPI_TARGETS))
  }

  return {
    targets,
    updateTarget,
    saveTargets,
    resetTargets,
  }
}
