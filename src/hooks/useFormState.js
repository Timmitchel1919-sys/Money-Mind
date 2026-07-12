import { useState } from "react"

export default function useFormState() {
  const [budgetCategory, setBudgetCategory] = useState("")
  const [budgetAmount, setBudgetAmount] = useState("")
  const [budgetCurrency, setBudgetCurrency] = useState("SRD")
  const [income, setIncome] = useState("9000")

  const [editingBudgetId, setEditingBudgetId] = useState(null)
  const [editBudgetCategory, setEditBudgetCategory] = useState("")
  const [editBudgetAmount, setEditBudgetAmount] = useState("")
  const [editBudgetCurrency, setEditBudgetCurrency] = useState("SRD")

  const [transactionType, setTransactionType] = useState("expense")
  const [transactionCategory, setTransactionCategory] = useState("")
  const [transactionAmount, setTransactionAmount] = useState("")
  const [transactionDescription, setTransactionDescription] = useState("")
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10))

  const [editingTransactionId, setEditingTransactionId] = useState(null)
  const [editTransactionType, setEditTransactionType] = useState("expense")
  const [editTransactionCategory, setEditTransactionCategory] = useState("")
  const [editTransactionAmount, setEditTransactionAmount] = useState("")
  const [editTransactionDescription, setEditTransactionDescription] = useState("")
  const [editTransactionDate, setEditTransactionDate] = useState("")

  const [assetName, setAssetName] = useState("")
  const [assetValue, setAssetValue] = useState("")
  const [liabilityName, setLiabilityName] = useState("")
  const [liabilityValue, setLiabilityValue] = useState("")

  const [goalName, setGoalName] = useState("")
  const [goalTarget, setGoalTarget] = useState("")
  const [goalSaved, setGoalSaved] = useState("")

  const [debtName, setDebtName] = useState("")
  const [debtBalance, setDebtBalance] = useState("")
  const [debtRate, setDebtRate] = useState("")
  const [debtPayment, setDebtPayment] = useState("")

  const [savingName, setSavingName] = useState("")
  const [savingTarget, setSavingTarget] = useState("")
  const [savingCurrent, setSavingCurrent] = useState("")
  const [savingMonthly, setSavingMonthly] = useState("")

  const [billName, setBillName] = useState("")
  const [billAmount, setBillAmount] = useState("")
  const [billDueDate, setBillDueDate] = useState(new Date().toISOString().slice(0, 10))
  const [billCategory, setBillCategory] = useState("")

  const [investmentName, setInvestmentName] = useState("")
  const [investmentType, setInvestmentType] = useState("Stock")
  const [investmentCost, setInvestmentCost] = useState("")
  const [investmentValue, setInvestmentValue] = useState("")

  return {
    budgetCategory,
    setBudgetCategory,
    budgetAmount,
    setBudgetAmount,
    budgetCurrency,
    setBudgetCurrency,
    income,
    setIncome,

    editingBudgetId,
    setEditingBudgetId,
    editBudgetCategory,
    setEditBudgetCategory,
    editBudgetAmount,
    setEditBudgetAmount,
    editBudgetCurrency,
    setEditBudgetCurrency,

    transactionType,
    setTransactionType,
    transactionCategory,
    setTransactionCategory,
    transactionAmount,
    setTransactionAmount,
    transactionDescription,
    setTransactionDescription,
    transactionDate,
    setTransactionDate,

    editingTransactionId,
    setEditingTransactionId,
    editTransactionType,
    setEditTransactionType,
    editTransactionCategory,
    setEditTransactionCategory,
    editTransactionAmount,
    setEditTransactionAmount,
    editTransactionDescription,
    setEditTransactionDescription,
    editTransactionDate,
    setEditTransactionDate,

    assetName,
    setAssetName,
    assetValue,
    setAssetValue,
    liabilityName,
    setLiabilityName,
    liabilityValue,
    setLiabilityValue,

    goalName,
    setGoalName,
    goalTarget,
    setGoalTarget,
    goalSaved,
    setGoalSaved,

    debtName,
    setDebtName,
    debtBalance,
    setDebtBalance,
    debtRate,
    setDebtRate,
    debtPayment,
    setDebtPayment,

    savingName,
    setSavingName,
    savingTarget,
    setSavingTarget,
    savingCurrent,
    setSavingCurrent,
    savingMonthly,
    setSavingMonthly,

    billName,
    setBillName,
    billAmount,
    setBillAmount,
    billDueDate,
    setBillDueDate,
    billCategory,
    setBillCategory,

    investmentName,
    setInvestmentName,
    investmentType,
    setInvestmentType,
    investmentCost,
    setInvestmentCost,
    investmentValue,
    setInvestmentValue,
  }
}