import { useEffect, useMemo, useState } from "react"
import "./index.css"

import DashboardLayout from "./layouts/DashboardLayout"
import Panel from "./components/Panel"
import AppBackground from "./components/AppBackground"

import Dashboard from "./pages/Dashboard"
import Budget from "./pages/Budget"
import Transactions from "./pages/Transactions"
import NetWorth from "./pages/NetWorth"
import CurrencyCenter from "./pages/Currencycenter"
import Goals from "./pages/Goals"
import EmergencyFund from "./pages/EmergencyFund"
import DebtManager from "./pages/DebtManager"
import SavingsPlanner from "./pages/SavingsPlanner"
import Bills from "./pages/Bills"
import FinancialCalendar from "./pages/FinancialCalendar"
import CashFlowForecast from "./pages/CashFlowForecast"
import Reports from "./pages/Reports"
import Charts from "./pages/Charts"
import FinancialHealth from "./pages/FinancialHealth"
import InvestmentTracker from "./pages/InvestmentTracker"
import RetirementPlanner from "./pages/RetirementPlanner"
import DividendTracker from "./pages/DividendTracker"
import PortfolioDashboard from "./pages/PortfolioDashboard"
import DividendDashboard from "./pages/DividendDashboard"
import InflationCalculator from "./pages/InflationCalculator"
import LoanPayoffCalculator from "./pages/LoanPayoffCalculator"
import Settings from "./pages/Settings"
import ExportCenter from "./pages/ExportCenter"
import KPIDashboard from "./pages/KPIDashboard"
import PublicExperience from "./components/PublicExperience"
import AppLockScreen from "./components/AppLockScreen"
import SpatialExperience from "./spatial/SpatialExperience"

import useAuth from "./hooks/useAuth"
import useBudget from "./hooks/useBudget"
import useTransactions from "./hooks/useTransactions"
import useAssets from "./hooks/useAssets"
import useGoals from "./hooks/useGoals"
import useDebt from "./hooks/useDebt"
import useSavings from "./hooks/useSavings"
import useBills from "./hooks/useBills"
import useInvestments from "./hooks/useInvestments"
import useCurrency from "./hooks/useCurrency"
import useEmergencyFund from "./hooks/useEmergencyFund"
import useFormState from "./hooks/useFormState"
import useProfile from "./hooks/useProfile"
import useSettings from "./hooks/useSettings"
import useAppLock from "./hooks/useAppLock"
import useFinancialKPIs from "./hooks/useFinancialKPIs"
import useFinancialBreakdown from "./hooks/useFinancialBreakdown"
import { projectFinancials } from "./financial/projection/projectFinancials"
import { convertCurrency, formatCurrencyAmount } from "./utils/currencyConversion"
import { SEARCHABLE_NAVIGATION } from "./constants/navigation"
import { featureFlags } from "./app/configuration/v2"

const PROTECTED_PAGES = new Set([
  ...SEARCHABLE_NAVIGATION.map((item) => item.value),
  "settings",
])
const DEVELOPMENT_PAGES = new Set(featureFlags.v2SpatialUI ? ["spatial"] : [])
const APP_PAGES = new Set([...PROTECTED_PAGES, ...DEVELOPMENT_PAGES])

function pageFromHash() {
  const page = window.location.hash.slice(1).split("/")[0]
  return APP_PAGES.has(page) ? page : "dashboard"
}

export default function App() {
  const [activePage, setActivePageState] = useState(pageFromHash)
  let content

  function setActivePage(page) {
    if (!APP_PAGES.has(page)) return
    window.history.pushState(null, "", `#${page}`)
    setActivePageState(page)
  }

  const budget = useBudget()
  const transaction = useTransactions()
  const asset = useAssets()
  const goal = useGoals()
  const debt = useDebt()
  const saving = useSavings()
  const bill = useBills()
  const investment = useInvestments()
  const currency = useCurrency()
  const emergency = useEmergencyFund()
  const form = useFormState()
  const settingsHook = useSettings()
  const appLock = useAppLock()

  // Layer 4 (V2 spatial): reuse the existing pure KPI selector as the
  // normalized financial model, then map it to the renderer-neutral scene
  // model consumed by <SpatialExperience>. Both are memoized so the spatial
  // adapter only re-runs when the underlying figures change.
  const financialKPIs = useFinancialKPIs({
    transactions: transaction.transactions,
    budgets: budget.budgets,
    assets: asset.assets,
    liabilities: asset.liabilities,
    goals: goal.goals,
    debts: debt.debts,
    savingsPlans: saving.savingsPlans,
    bills: bill.bills,
    investments: investment.investments,
    emergencySavings: emergency.emergencySavings,
    monthlyExpenses: emergency.monthlyExpenses,
    monthlyIncome: form.income,
  })

  // Layer 5 (V2 graph drill-down): per-domain line items, only computed into the
  // scene model when the graph-engine flag is on. Flag off -> no `children` key
  // -> the scene is identical to Layer 4.
  const financialBreakdown = useFinancialBreakdown({
    transactions: transaction.transactions,
    assets: asset.assets,
    debts: debt.debts,
    investments: investment.investments,
    savingsPlans: saving.savingsPlans,
  })

  // Layer 6 (V2 simulation): "what-if" levers. Off by default; only wired into
  // the spatial view when featureFlags.v2Simulation is on.
  const [sim, setSim] = useState({
    active: false,
    monthsForward: 0,
    extraDebtPayment: 0,
    extraMonthlySaving: 0,
    annualReturnPct: 6,
    oneOff: 0,
  })
  const simControls = useMemo(() => ({
    ...sim,
    setLever: (key, value) => setSim((s) => ({ ...s, [key]: value })),
    reset: () => setSim((s) => ({ active: s.active, monthsForward: 0, extraDebtPayment: 0, extraMonthlySaving: 0, annualReturnPct: 6, oneOff: 0 })),
    toggle: () => setSim((s) => ({ ...s, active: !s.active })),
  }), [sim])

  const spatialFinancialModel = useMemo(() => {
    const modelCurrency = settingsHook.settings.currency || "SRD"
    const money = (value) => formatCurrencyAmount(value, modelCurrency, settingsHook.settings.numberFormat)

    const simActive = featureFlags.v2Simulation && sim.active
    const snapshot = {
      income: financialKPIs.totalIncome,
      expenses: financialKPIs.totalExpenses,
      assets: financialKPIs.totalAssets,
      liabilities: financialKPIs.totalLiabilities,
      debt: financialKPIs.totalDebt,
      monthlyDebtPayment: financialKPIs.monthlyDebtPayments,
      savings: financialKPIs.totalSavingsCurrent,
      monthlySaving: saving.savingsPlans.reduce((total, plan) => total + Number(plan.monthly || 0), 0),
      investments: financialKPIs.investmentValue,
    }
    const projected = simActive ? projectFinancials(snapshot, sim) : snapshot
    const netWorth = simActive ? projected.netWorth : financialKPIs.netWorth

    const domain = (id, amount) => {
      const base = { amount, detail: money(amount) }
      if (!featureFlags.v2GraphEngine) return base
      return { ...base, children: financialBreakdown[id].map((child) => ({ ...child, detail: money(child.amount) })) }
    }
    return {
      projected: simActive,
      monthsForward: simActive ? Math.max(0, Math.round(Number(sim.monthsForward) || 0)) : 0,
      core: {
        label: "Money Mind",
        detail: money(netWorth),
        healthScore: financialKPIs.healthScore,
      },
      domains: {
        income: domain("income", projected.income),
        investments: domain("investments", projected.investments),
        assets: domain("assets", projected.assets),
        debt: domain("debt", projected.debt),
        expenses: domain("expenses", projected.expenses),
        savings: domain("savings", projected.savings),
      },
    }
  }, [financialKPIs, financialBreakdown, saving.savingsPlans, sim, settingsHook.settings.currency, settingsHook.settings.numberFormat])

  useEffect(() => {
    const preference = settingsHook.settings.themeMode || "system"
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const applyTheme = () => {
      const resolved = preference === "system" ? (media.matches ? "dark" : "light") : preference
      document.documentElement.dataset.theme = resolved
      document.documentElement.dataset.themePreference = preference
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#030712" : "#F3F1FF")
    }
    applyTheme()
    media.addEventListener?.("change", applyTheme)
    return () => media.removeEventListener?.("change", applyTheme)
  }, [settingsHook.settings.themeMode])

  async function loadAllData(userId) {
    await Promise.all([
      budget.loadBudgets(userId),
      transaction.loadTransactions(userId),
      asset.loadAssets(userId),
      asset.loadLiabilities(userId),
      goal.loadGoals(userId),
      debt.loadDebts(userId),
      saving.loadSavingsPlans(userId),
      bill.loadBills(userId),
      investment.loadInvestments(userId),
    ])
  }

  const auth = useAuth(loadAllData)
  const profile = useProfile(auth.user?.uid)

  useEffect(() => {
    function syncRoute() {
      setActivePageState(pageFromHash())
    }
    window.addEventListener("hashchange", syncRoute)
    window.addEventListener("popstate", syncRoute)
    return () => {
      window.removeEventListener("hashchange", syncRoute)
      window.removeEventListener("popstate", syncRoute)
    }
  }, [])

  useEffect(() => {
    const rawRoute = window.location.hash.slice(1).split("/")[0]
    if (auth.user) {
      const intended = sessionStorage.getItem("moneyMindIntendedPage")
      // APP_PAGES (not just PROTECTED_PAGES) so the flag-gated development route
      // (#spatial) stays reachable for a signed-in user; `intended` is a
      // post-login redirect target, which is only ever a protected page.
      const nextPage = APP_PAGES.has(rawRoute)
        ? rawRoute
        : PROTECTED_PAGES.has(intended)
          ? intended
          : "dashboard"
      sessionStorage.removeItem("moneyMindIntendedPage")
      if (rawRoute !== nextPage) window.history.replaceState(null, "", `#${nextPage}`)
      setActivePageState(nextPage)
      return
    }
    if (PROTECTED_PAGES.has(rawRoute)) {
      sessionStorage.setItem("moneyMindIntendedPage", rawRoute)
      window.history.replaceState(null, "", "#login")
    }
  }, [auth.user])

  function getUserId() {
    return auth.user?.uid || null
  }

  async function handleAddBudget(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.budgetCategory || !form.budgetAmount) return

    await budget.addBudget(userId, {
      category: form.budgetCategory,
      amount: Number(form.budgetAmount),
      currency: form.budgetCurrency,
      income: Number(form.income),
    })

    form.setBudgetCategory("")
    form.setBudgetAmount("")
    form.setBudgetCurrency(settingsHook.settings.currency || "SRD")
  }

  function startEditBudget(item) {
    form.setEditingBudgetId(item.id)
    form.setEditBudgetCategory(item.category)
    form.setEditBudgetAmount(String(item.amount))
    form.setEditBudgetCurrency(item.currency || "SRD")
  }

  function cancelEditBudget() {
    form.setEditingBudgetId(null)
    form.setEditBudgetCategory("")
    form.setEditBudgetAmount("")
    form.setEditBudgetCurrency(settingsHook.settings.currency || "SRD")
  }

  async function handleUpdateBudget(id) {
    const userId = getUserId()
    if (!userId || !form.editBudgetCategory || !form.editBudgetAmount) return

    await budget.updateBudget(userId, id, {
      category: form.editBudgetCategory,
      amount: Number(form.editBudgetAmount),
      currency: form.editBudgetCurrency,
      income: Number(form.income),
    })

    cancelEditBudget()
  }

  async function handleDeleteBudget(id) {
    const userId = getUserId()
    if (!userId) return
    await budget.deleteBudget(userId, id)
  }

  async function handleAddTransaction(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.transactionCategory || !form.transactionAmount) return

    await transaction.addTransaction(userId, {
      type: form.transactionType,
      category: form.transactionCategory,
      amount: Number(form.transactionAmount),
      description: form.transactionDescription,
      date: form.transactionDate,
    })

    form.setTransactionType("expense")
    form.setTransactionCategory("")
    form.setTransactionAmount("")
    form.setTransactionDescription("")
    form.setTransactionDate(new Date().toISOString().slice(0, 10))
  }

  function startEditTransaction(item) {
    form.setEditingTransactionId(item.id)
    form.setEditTransactionType(item.type)
    form.setEditTransactionCategory(item.category)
    form.setEditTransactionAmount(String(item.amount))
    form.setEditTransactionDescription(item.description || "")
    form.setEditTransactionDate(item.date || new Date().toISOString().slice(0, 10))
  }

  function cancelEditTransaction() {
    form.setEditingTransactionId(null)
  }

  async function handleUpdateTransaction(id) {
    const userId = getUserId()
    if (!userId || !form.editTransactionCategory || !form.editTransactionAmount) return

    await transaction.updateTransaction(userId, id, {
      type: form.editTransactionType,
      category: form.editTransactionCategory,
      amount: Number(form.editTransactionAmount),
      description: form.editTransactionDescription,
      date: form.editTransactionDate,
    })

    cancelEditTransaction()
  }

  async function handleDeleteTransaction(id) {
    const userId = getUserId()
    if (!userId) return
    await transaction.deleteTransaction(userId, id)
  }

  async function handleAddAsset(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.assetName || !form.assetValue) return

    await asset.addAsset(userId, {
      name: form.assetName,
      value: Number(form.assetValue),
    })

    form.setAssetName("")
    form.setAssetValue("")
  }

  async function handleAddLiability(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.liabilityName || !form.liabilityValue) return

    await asset.addLiability(userId, {
      name: form.liabilityName,
      value: Number(form.liabilityValue),
    })

    form.setLiabilityName("")
    form.setLiabilityValue("")
  }

  async function handleDeleteAsset(id) {
    const userId = getUserId()
    if (!userId) return
    await asset.deleteAsset(userId, id)
  }

  async function handleDeleteLiability(id) {
    const userId = getUserId()
    if (!userId) return
    await asset.deleteLiability(userId, id)
  }

  async function handleAddGoal(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.goalName || !form.goalTarget) return

    await goal.addGoal(userId, {
      name: form.goalName,
      target: Number(form.goalTarget),
      saved: Number(form.goalSaved || 0),
    })

    form.setGoalName("")
    form.setGoalTarget("")
    form.setGoalSaved("")
  }

  async function handleDeleteGoal(id) {
    const userId = getUserId()
    if (!userId) return
    await goal.deleteGoal(userId, id)
  }

  async function handleAddDebt(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.debtName || !form.debtBalance) return

    await debt.addDebt(userId, {
      name: form.debtName,
      balance: Number(form.debtBalance),
      rate: Number(form.debtRate || 0),
      payment: Number(form.debtPayment || 0),
    })

    form.setDebtName("")
    form.setDebtBalance("")
    form.setDebtRate("")
    form.setDebtPayment("")
  }

  async function handleDeleteDebt(id) {
    const userId = getUserId()
    if (!userId) return
    await debt.deleteDebt(userId, id)
  }

  async function handleAddSavingPlan(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.savingName || !form.savingTarget) return

    await saving.addSavingPlan(userId, {
      name: form.savingName,
      target: Number(form.savingTarget),
      current: Number(form.savingCurrent || 0),
      monthly: Number(form.savingMonthly || 0),
    })

    form.setSavingName("")
    form.setSavingTarget("")
    form.setSavingCurrent("")
    form.setSavingMonthly("")
  }

  async function handleDeleteSavingPlan(id) {
    const userId = getUserId()
    if (!userId) return
    await saving.deleteSavingPlan(userId, id)
  }

  async function handleAddBill(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.billName || !form.billAmount) return

    await bill.addBill(userId, {
      name: form.billName,
      category: form.billCategory,
      amount: Number(form.billAmount),
      dueDate: form.billDueDate,
    })

    form.setBillName("")
    form.setBillAmount("")
    form.setBillCategory("")
    form.setBillDueDate(new Date().toISOString().slice(0, 10))
  }

  async function handleDeleteBill(id) {
    const userId = getUserId()
    if (!userId) return
    await bill.deleteBill(userId, id)
  }

  async function handleAddInvestment(e) {
    e.preventDefault()
    const userId = getUserId()
    if (!userId || !form.investmentName || !form.investmentCost) return

    await investment.addInvestment(userId, {
      name: form.investmentName,
      type: form.investmentType,
      cost: Number(form.investmentCost),
      value: Number(form.investmentValue || 0),
    })

    form.setInvestmentName("")
    form.setInvestmentType("Stock")
    form.setInvestmentCost("")
    form.setInvestmentValue("")
  }

  async function handleDeleteInvestment(id) {
    const userId = getUserId()
    if (!userId) return
    await investment.deleteInvestment(userId, id)
  }

  if (!auth.user && activePage === "spatial" && featureFlags.v2SpatialUI) {
    content = <SpatialExperience />
  } else if (!auth.user) {
    content = (
      <PublicExperience auth={auth} settings={settingsHook.settings} updateSetting={settingsHook.updateSetting} />
    )
  } else {
  const baseCurrency = settingsHook.settings.currency || "SRD"

  const totalBudget = budget.budgets.reduce((sum, item) => {
    const itemCurrency = item.currency || "SRD"
    const amountInBase =
      itemCurrency === baseCurrency
        ? Number(item.amount || 0)
        : convertCurrency({ amount: item.amount, fromCurrency: itemCurrency, toCurrency: baseCurrency, rates: currency.rates })
    return sum + amountInBase
  }, 0)

  const transactionIncome = transaction.transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + convertCurrency({ amount: item.amount, fromCurrency: item.currency || "SRD", toCurrency: baseCurrency, rates: currency.rates }), 0)

  const transactionExpenses = transaction.transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + convertCurrency({ amount: item.amount, fromCurrency: item.currency || "SRD", toCurrency: baseCurrency, rates: currency.rates }), 0)

  const cashFlow = transactionIncome - transactionExpenses
  const remainingBudget = Number(form.income || 0) - totalBudget

  content = (
    <DashboardLayout
      user={auth.user}
      profile={profile.profile}
      settings={settingsHook.settings}
      updateSetting={settingsHook.updateSetting}
      handleLogout={auth.handleLogout}
      activePage={activePage}
      setActivePage={setActivePage}
      moneyAIProps={{
        userId: auth.user?.uid,
        transactions: transaction.transactions,
        budgets: budget.budgets,
        assets: asset.assets,
        liabilities: asset.liabilities,
        goals: goal.goals,
        debts: debt.debts,
        savingsPlans: saving.savingsPlans,
        bills: bill.bills,
        investments: investment.investments,
        emergencySavings: emergency.emergencySavings,
        monthlyExpenses: emergency.monthlyExpenses,
        monthlyIncome: form.income,
      }}
    >
      {activePage === "dashboard" && (
        <Dashboard
          transactionIncome={transactionIncome}
          transactionExpenses={transactionExpenses}
          cashFlow={cashFlow}
          totalBudget={totalBudget}
          remainingBudget={remainingBudget}
          transactions={transaction.transactions}
          budgets={budget.budgets}
          assets={asset.assets}
          liabilities={asset.liabilities}
          goals={goal.goals}
          debts={debt.debts}
          savingsPlans={saving.savingsPlans}
          bills={bill.bills}
          investments={investment.investments}
          emergencySavings={emergency.emergencySavings}
          monthlyExpenses={emergency.monthlyExpenses}
          monthlyIncome={form.income}
          displayName={profile.profile?.displayName}
          setActivePage={setActivePage}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "budget" && (
        <Budget
          income={form.income}
          setIncome={form.setIncome}
          budgetCategory={form.budgetCategory}
          setBudgetCategory={form.setBudgetCategory}
          budgetAmount={form.budgetAmount}
          setBudgetAmount={form.setBudgetAmount}
          budgetCurrency={form.budgetCurrency}
          setBudgetCurrency={form.setBudgetCurrency}
          handleAddBudget={handleAddBudget}
          budgets={budget.budgets}
          remainingBudget={remainingBudget}
          baseCurrency={baseCurrency}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          editingBudgetId={form.editingBudgetId}
          editBudgetCategory={form.editBudgetCategory}
          setEditBudgetCategory={form.setEditBudgetCategory}
          editBudgetAmount={form.editBudgetAmount}
          setEditBudgetAmount={form.setEditBudgetAmount}
          editBudgetCurrency={form.editBudgetCurrency}
          setEditBudgetCurrency={form.setEditBudgetCurrency}
          startEditBudget={startEditBudget}
          cancelEditBudget={cancelEditBudget}
          handleUpdateBudget={handleUpdateBudget}
          handleDeleteBudget={handleDeleteBudget}
        />
      )}

      {activePage === "transactions" && (
        <Transactions
          transactionType={form.transactionType}
          setTransactionType={form.setTransactionType}
          transactionCategory={form.transactionCategory}
          setTransactionCategory={form.setTransactionCategory}
          transactionAmount={form.transactionAmount}
          setTransactionAmount={form.setTransactionAmount}
          transactionDate={form.transactionDate}
          setTransactionDate={form.setTransactionDate}
          transactionDescription={form.transactionDescription}
          setTransactionDescription={form.setTransactionDescription}
          handleAddTransaction={handleAddTransaction}
          transactions={transaction.transactions}
          transactionIncome={transactionIncome}
          transactionExpenses={transactionExpenses}
          cashFlow={cashFlow}
          editingTransactionId={form.editingTransactionId}
          editTransactionType={form.editTransactionType}
          setEditTransactionType={form.setEditTransactionType}
          editTransactionCategory={form.editTransactionCategory}
          setEditTransactionCategory={form.setEditTransactionCategory}
          editTransactionAmount={form.editTransactionAmount}
          setEditTransactionAmount={form.setEditTransactionAmount}
          editTransactionDate={form.editTransactionDate}
          setEditTransactionDate={form.setEditTransactionDate}
          editTransactionDescription={form.editTransactionDescription}
          setEditTransactionDescription={form.setEditTransactionDescription}
          startEditTransaction={startEditTransaction}
          cancelEditTransaction={cancelEditTransaction}
          handleUpdateTransaction={handleUpdateTransaction}
          handleDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {activePage === "networth" && (
        <NetWorth
          assets={asset.assets}
          liabilities={asset.liabilities}
          assetName={form.assetName}
          setAssetName={form.setAssetName}
          assetValue={form.assetValue}
          setAssetValue={form.setAssetValue}
          liabilityName={form.liabilityName}
          setLiabilityName={form.setLiabilityName}
          liabilityValue={form.liabilityValue}
          setLiabilityValue={form.setLiabilityValue}
          handleAddAsset={handleAddAsset}
          handleAddLiability={handleAddLiability}
          handleDeleteAsset={handleDeleteAsset}
          handleDeleteLiability={handleDeleteLiability}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "goals" && (
        <Goals
          goals={goal.goals}
          goalName={form.goalName}
          setGoalName={form.setGoalName}
          goalTarget={form.goalTarget}
          setGoalTarget={form.setGoalTarget}
          goalSaved={form.goalSaved}
          setGoalSaved={form.setGoalSaved}
          handleAddGoal={handleAddGoal}
          handleDeleteGoal={handleDeleteGoal}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "currency" && (
        <CurrencyCenter
          rates={currency.rates}
          rateStatus={currency.rateStatus}
          updatedAt={currency.updatedAt}
          rateError={currency.rateError}
          refreshRates={currency.refreshRates}
          numberFormat={settingsHook.settings.numberFormat}
          converterAmount={currency.converterAmount}
          setConverterAmount={currency.setConverterAmount}
          fromCurrency={currency.fromCurrency}
          setFromCurrency={currency.setFromCurrency}
          toCurrency={currency.toCurrency}
          setToCurrency={currency.setToCurrency}
        />
      )}

      {activePage === "emergency" && (
        <EmergencyFund
          emergencySavings={emergency.emergencySavings}
          setEmergencySavings={emergency.setEmergencySavings}
          monthlyExpenses={emergency.monthlyExpenses}
          setMonthlyExpenses={emergency.setMonthlyExpenses}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "debt" && (
        <DebtManager
          debts={debt.debts}
          debtName={form.debtName}
          setDebtName={form.setDebtName}
          debtBalance={form.debtBalance}
          setDebtBalance={form.setDebtBalance}
          debtRate={form.debtRate}
          setDebtRate={form.setDebtRate}
          debtPayment={form.debtPayment}
          setDebtPayment={form.setDebtPayment}
          handleAddDebt={handleAddDebt}
          handleDeleteDebt={handleDeleteDebt}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "savings" && (
        <SavingsPlanner
          savingsPlans={saving.savingsPlans}
          savingName={form.savingName}
          setSavingName={form.setSavingName}
          savingTarget={form.savingTarget}
          setSavingTarget={form.setSavingTarget}
          savingCurrent={form.savingCurrent}
          setSavingCurrent={form.setSavingCurrent}
          savingMonthly={form.savingMonthly}
          setSavingMonthly={form.setSavingMonthly}
          handleAddSavingPlan={handleAddSavingPlan}
          handleDeleteSavingPlan={handleDeleteSavingPlan}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "bills" && (
        <Bills
          bills={bill.bills}
          billName={form.billName}
          setBillName={form.setBillName}
          billAmount={form.billAmount}
          setBillAmount={form.setBillAmount}
          billDueDate={form.billDueDate}
          setBillDueDate={form.setBillDueDate}
          billCategory={form.billCategory}
          setBillCategory={form.setBillCategory}
          handleAddBill={handleAddBill}
          handleDeleteBill={handleDeleteBill}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}
      
      {activePage === "dividends" && (
        <DividendTracker rates={currency.rates} numberFormat={settingsHook.settings.numberFormat} baseCurrency={baseCurrency} />
      )}

      {activePage === "dividendDashboard" && (
        <DividendDashboard rates={currency.rates} numberFormat={settingsHook.settings.numberFormat} baseCurrency={baseCurrency} />
      )}

      {activePage === "inflation" && (
        <InflationCalculator
          rates={currency.rates}
          rateStatus={currency.rateStatus}
          numberFormat={settingsHook.settings.numberFormat}
          defaultCurrency={baseCurrency}
        />
      )}

      {activePage === "loanpayoff" && (
        <LoanPayoffCalculator rates={currency.rates} numberFormat={settingsHook.settings.numberFormat} baseCurrency={baseCurrency} />
      )}

      {activePage === "calendar" && (
        <FinancialCalendar
          bills={bill.bills}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "cashflowforecast" && (
        <CashFlowForecast
          transactions={transaction.transactions}
          bills={bill.bills}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "reports" && (
        <Reports
          transactions={transaction.transactions}
          budgets={budget.budgets}
          income={form.income}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "charts" && (
        <Charts
          transactions={transaction.transactions}
          budgets={budget.budgets}
          assets={asset.assets}
          liabilities={asset.liabilities}
          savingsPlans={saving.savingsPlans}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "health" && (
        <FinancialHealth
          transactions={transaction.transactions}
          debts={debt.debts}
          emergencySavings={emergency.emergencySavings}
          monthlyExpenses={emergency.monthlyExpenses}
        />
      )}

      {activePage === "investments" && (
        <InvestmentTracker
          investments={investment.investments}
          investmentName={form.investmentName}
          setInvestmentName={form.setInvestmentName}
          investmentType={form.investmentType}
          setInvestmentType={form.setInvestmentType}
          investmentCost={form.investmentCost}
          setInvestmentCost={form.setInvestmentCost}
          investmentValue={form.investmentValue}
          setInvestmentValue={form.setInvestmentValue}
          handleAddInvestment={handleAddInvestment}
          handleDeleteInvestment={handleDeleteInvestment}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}
      
      {activePage === "portfolio" && (
        <PortfolioDashboard
          investments={investment.investments}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "retirement" && (
        <RetirementPlanner
          transactions={transaction.transactions}
          investments={investment.investments}
          savingsPlans={saving.savingsPlans}
          debts={debt.debts}
        />
      )}

      {activePage === "export" && (
        <ExportCenter
          transactions={transaction.transactions}
          budgets={budget.budgets}
          assets={asset.assets}
          liabilities={asset.liabilities}
          goals={goal.goals}
          debts={debt.debts}
          savingsPlans={saving.savingsPlans}
          investments={investment.investments}
          bills={bill.bills}
        />
      )}

      {activePage === "settings" && (
        <Settings
          user={auth.user}
          profile={profile.profile}
          updateProfile={profile.updateProfile}
          saveProfile={profile.saveProfile}
          resetProfile={profile.resetProfile}
          settings={settingsHook.settings}
          updateSetting={settingsHook.updateSetting}
          updateNotificationPreference={settingsHook.updateNotificationPreference}
          updateMoneyAIVoiceSetting={settingsHook.updateMoneyAIVoiceSetting}
          saveSettings={settingsHook.saveSettings}
          resetSettings={settingsHook.resetSettings}
          appLock={appLock}
          transactions={transaction.transactions}
          bills={bill.bills}
          debts={debt.debts}
          goals={goal.goals}
          investments={investment.investments}
          emergencySavings={emergency.emergencySavings}
          monthlyExpenses={emergency.monthlyExpenses}
          monthlyIncome={form.income}
          rateStatus={currency.rateStatus}
          updatedAt={currency.updatedAt}
          rateError={currency.rateError}
          refreshRates={currency.refreshRates}
        />
      )}

      {activePage === "kpis" && (
        <KPIDashboard
          user={auth.user}
          transactions={transaction.transactions}
          budgets={budget.budgets}
          assets={asset.assets}
          liabilities={asset.liabilities}
          goals={goal.goals}
          debts={debt.debts}
          savingsPlans={saving.savingsPlans}
          bills={bill.bills}
          investments={investment.investments}
          emergencySavings={emergency.emergencySavings}
          monthlyExpenses={emergency.monthlyExpenses}
          monthlyIncome={form.income}
          rates={currency.rates}
          numberFormat={settingsHook.settings.numberFormat}
          baseCurrency={baseCurrency}
        />
      )}

      {activePage === "spatial" && featureFlags.v2SpatialUI && (
        <SpatialExperience model={spatialFinancialModel} sim={featureFlags.v2Simulation ? simControls : undefined} />
      )}

      {![
        "dashboard",
        "budget",
        "transactions",
        "bills",
        "calendar",
        "cashflowforecast",
        "networth",
        "goals",
        "emergency",
        "debt",
        "savings",
        "currency",
        "investments",
        "portfolio",
        "dividends",
        "dividendDashboard",
        "retirement",
        "inflation",
        "loanpayoff",
        "reports",
        "charts",
        "health",
        "kpis",
        "export",
        "settings",
        ...(featureFlags.v2SpatialUI ? ["spatial"] : []),
      ].includes(activePage) && (
        <Panel title="Coming Soon">
          <p className="mt-4 text-[#A5ADB8]">
            Deze module bouwen we in een volgende stap: {activePage}.
          </p>
        </Panel>
      )}
    </DashboardLayout>
  )

  if (appLock.isEnabled && appLock.isLocked) {
    content = (
      <AppLockScreen
        appLock={appLock}
        displayName={profile.profile?.displayName || "Shaquil"}
        onForgot={() => {
          appLock.disableLock()
          auth.handleLogout()
        }}
      />
    )
  }
  }

  return (
    <>
      {auth.user && <AppBackground themeId={settingsHook.settings.backgroundTheme} />}
      {content}
    </>
  )
}
