import { useState } from "react"

export default function useEmergencyFund() {
  const [emergencySavings, setEmergencySavings] = useState("30000")
  const [monthlyExpenses, setMonthlyExpenses] = useState("5000")

  return {
    emergencySavings,
    setEmergencySavings,
    monthlyExpenses,
    setMonthlyExpenses,
  }
}