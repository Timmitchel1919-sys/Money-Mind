import { useState } from "react"
import Panel from "../components/Panel"
import Card from "../components/Card"
import Input from "../components/Input"
import PageInfoButton from "../components/PageInfoButton"
import KPICard from "../components/KPICard"
import KPIProgressBar from "../components/KPIProgressBar"
import KPIComparisonChart from "../components/KPIComparisonChart"
import KPITrendChart from "../components/KPITrendChart"
import KPIRadarChart from "../components/KPIRadarChart"
import KPIInsightCard from "../components/KPIInsightCard"
import useFinancialKPIs, { KPI_PERIODS, getKpiStatus } from "../hooks/useFinancialKPIs"
import useKPITargets from "../hooks/useKPITargets"
import useKPIInsights from "../hooks/useKPIInsights"
import { exportKpiSummary } from "../utils/kpiExport"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"

function formatCurrency(value) {
  return `SRD ${Number(value || 0).toFixed(2)}`
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

function statusExplanation(label) {
  switch (label) {
    case "Excellent":
      return "Performing at or beyond target."
    case "Good":
      return "Tracking close to target."
    case "Warning":
      return "Meaningfully behind target — worth attention."
    case "Critical":
      return "Well below target — needs action."
    default:
      return ""
  }
}

function netWorthStatus(netWorth, totalAssets, totalLiabilities) {
  if (netWorth <= 0) return { label: "Critical", color: "#EF4444" }
  const liabilityRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0
  return liabilityRatio < 0.5 ? { label: "Excellent", color: "#22C55E" } : { label: "Good", color: "#06B6D4" }
}

export default function KPIDashboard({
  user,
  transactions = [],
  budgets = [],
  assets = [],
  liabilities = [],
  goals = [],
  debts = [],
  savingsPlans = [],
  bills = [],
  investments = [],
  emergencySavings = 0,
  monthlyExpenses = 0,
  monthlyIncome = 0,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  const [period, setPeriod] = useState("All Time")
  const [editingTargets, setEditingTargets] = useState(false)
  const [savedMessage, setSavedMessage] = useState("")

  const kpis = useFinancialKPIs({
    transactions,
    budgets,
    assets,
    liabilities,
    goals,
    debts,
    savingsPlans,
    bills,
    investments,
    emergencySavings,
    monthlyExpenses,
    monthlyIncome,
    period,
  })

  const { targets, updateTarget, saveTargets, resetTargets } = useKPITargets(user?.uid)
  const insights = useKPIInsights(kpis)

  function handleSaveTargets() {
    saveTargets()
    setSavedMessage("Targets saved.")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  function handleResetTargets() {
    resetTargets()
    setSavedMessage("Targets reset to defaults.")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  const nwStatus = netWorthStatus(kpis.netWorth, kpis.totalAssets, kpis.totalLiabilities)

  const mainCards = [
    {
      key: "healthScore",
      title: "Financial Health Score",
      value: `${Math.round(kpis.healthScore)}/100`,
      target: "100",
      gap: `${Math.max(0, 100 - Math.round(kpis.healthScore))} pts to max score`,
      status: { label: kpis.healthClassification.label, color: kpis.healthClassification.color },
      explanation: kpis.healthClassification.description,
      progressValue: kpis.healthScore,
      icon: "◆",
    },
    {
      key: "savingsRate",
      title: "Savings Rate",
      value: formatPercent(kpis.savingsRate),
      target: formatPercent(targets.savingsRate),
      gap: `${(kpis.savingsRate - targets.savingsRate).toFixed(1)} pts vs target`,
      status: getKpiStatus(kpis.savingsRate, targets.savingsRate, true),
      icon: "%",
      progressValue:
        targets.savingsRate > 0 ? clamp((kpis.savingsRate / targets.savingsRate) * 100, 0, 100) : clamp(kpis.savingsRate, 0, 100),
    },
    {
      key: "expenseRatio",
      title: "Expense Ratio",
      value: formatPercent(kpis.expenseRatio),
      target: formatPercent(targets.expenseRatio),
      gap: `${(kpis.expenseRatio - targets.expenseRatio).toFixed(1)} pts vs target`,
      status: getKpiStatus(kpis.expenseRatio, targets.expenseRatio, false),
      icon: "▤",
      progressValue:
        targets.expenseRatio > 0 ? clamp((kpis.expenseRatio / targets.expenseRatio) * 100, 0, 100) : clamp(kpis.expenseRatio, 0, 100),
    },
    {
      key: "cashFlowMargin",
      title: "Cash Flow Margin",
      value: formatPercent(kpis.cashFlowMargin),
      target: formatPercent(targets.cashFlowMargin),
      gap: `${(kpis.cashFlowMargin - targets.cashFlowMargin).toFixed(1)} pts vs target`,
      status: getKpiStatus(kpis.cashFlowMargin, targets.cashFlowMargin, true),
      icon: "⇄",
      progressValue:
        targets.cashFlowMargin > 0
          ? clamp((kpis.cashFlowMargin / targets.cashFlowMargin) * 100, 0, 100)
          : clamp(kpis.cashFlowMargin, 0, 100),
    },
    {
      key: "emergencyFundCoverage",
      title: "Emergency Fund Coverage",
      value: `${kpis.emergencyFundCoverage.toFixed(1)} months`,
      target: `${targets.emergencyFundMonths} months`,
      gap: `${(kpis.emergencyFundCoverage - targets.emergencyFundMonths).toFixed(1)} months vs target`,
      status: getKpiStatus(kpis.emergencyFundCoverage, targets.emergencyFundMonths, true),
      icon: "▣",
      progressValue:
        targets.emergencyFundMonths > 0 ? clamp((kpis.emergencyFundCoverage / targets.emergencyFundMonths) * 100, 0, 100) : 0,
    },
    {
      key: "debtToIncome",
      title: "Debt-to-Income Ratio",
      value: formatPercent(kpis.debtToIncome),
      target: formatPercent(targets.debtToIncome),
      gap: `${(kpis.debtToIncome - targets.debtToIncome).toFixed(1)} pts vs target`,
      status: getKpiStatus(kpis.debtToIncome, targets.debtToIncome, false),
      icon: "Δ",
      progressValue:
        targets.debtToIncome > 0 ? clamp((kpis.debtToIncome / targets.debtToIncome) * 100, 0, 100) : clamp(kpis.debtToIncome, 0, 100),
    },
    {
      key: "netWorth",
      title: "Net Worth",
      value: formatCurrency(kpis.netWorth),
      target: "SRD 0.00 (breakeven)",
      gap: `${kpis.netWorth >= 0 ? "+" : ""}${formatCurrency(kpis.netWorth)} vs breakeven`,
      status: nwStatus,
      icon: "Σ",
      progressValue: kpis.totalAssets > 0 ? clamp((kpis.netWorth / kpis.totalAssets) * 100, 0, 100) : kpis.netWorth > 0 ? 100 : 0,
    },
    {
      key: "budgetAdherence",
      title: "Budget Adherence",
      value: formatPercent(kpis.budgetAdherence),
      target: formatPercent(targets.budgetAdherence),
      gap: `${(kpis.budgetAdherence - targets.budgetAdherence).toFixed(1)} pts vs target`,
      status: getKpiStatus(kpis.budgetAdherence, targets.budgetAdherence, true),
      icon: "▦",
      progressValue: targets.budgetAdherence > 0 ? clamp((kpis.budgetAdherence / targets.budgetAdherence) * 100, 0, 100) : 0,
    },
  ].map((card) => ({
    ...card,
    explanation:
      card.key === "healthScore"
        ? card.explanation
        : card.key === "netWorth"
        ? kpis.netWorth <= 0
          ? "Liabilities currently outweigh assets."
          : kpis.totalAssets > 0 && kpis.totalLiabilities / kpis.totalAssets < 0.5
          ? "Assets comfortably exceed liabilities."
          : "Positive net worth, but liabilities are a large share of assets."
        : statusExplanation(card.status.label),
  }))

  function handleExport() {
    exportKpiSummary(
      mainCards.map((card) => ({
        name: card.title,
        current: card.value,
        target: card.target,
        gap: card.gap,
        status: card.status.label,
        explanation: card.explanation,
      }))
    )
  }

  const comparisonData = [
    { name: "Savings Rate", actual: Number(kpis.savingsRate.toFixed(1)), target: targets.savingsRate },
    { name: "Cash Flow Margin", actual: Number(kpis.cashFlowMargin.toFixed(1)), target: targets.cashFlowMargin },
    { name: "Emergency Fund (mo)", actual: Number(kpis.emergencyFundCoverage.toFixed(1)), target: targets.emergencyFundMonths },
    { name: "Budget Adherence", actual: Number(kpis.budgetAdherence.toFixed(1)), target: targets.budgetAdherence },
    { name: "Investment Return", actual: Number(kpis.investmentReturn.toFixed(1)), target: targets.investmentReturn },
  ]

  const performanceData = [
    { name: "Income", value: Number(kpis.totalIncome.toFixed(2)), color: "#22C55E" },
    { name: "Expenses", value: Number(kpis.totalExpenses.toFixed(2)), color: "#EF4444" },
    { name: "Savings", value: Number(kpis.savingsAmount.toFixed(2)), color: "#06B6D4" },
    { name: "Free Cash Flow", value: Number(kpis.freeCashFlow.toFixed(2)), color: "#FBBF24" },
  ]

  const positionData = [
    { name: "Assets", value: Number(kpis.totalAssets.toFixed(2)), color: "#3B82F6" },
    { name: "Liabilities", value: Number(kpis.totalLiabilities.toFixed(2)), color: "#EC4899" },
    { name: "Net Worth", value: Number(kpis.netWorth.toFixed(2)), color: "#8B5CF6" },
    { name: "Debt", value: Number(kpis.totalDebt.toFixed(2)), color: "#F97316" },
  ]

  const radarData = kpis.healthComponents.map((component) => ({
    name: component.label,
    score: Math.round(component.normalized),
  }))

  return (
    <div className="space-y-6">
      <Panel
        title={
          <span className="flex items-center gap-3">
            Financial KPIs
            <PageInfoButton pageKey="kpis" />
          </span>
        }
      >
        <p className="mt-2 text-[#A5ADB8]">
          A consolidated view of your financial performance, health, and risk — computed live from
          your Money Mind data.
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-2 block text-sm text-[#D5D8DD]">Period</label>
            <select
              className="w-full min-w-[180px] rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {KPI_PERIODS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setEditingTargets((prev) => !prev)}
            className="rounded-xl border border-[#BFC4CC]/30 px-6 py-3 font-semibold text-[#D5D8DD] hover:bg-white/5"
          >
            {editingTargets ? "Close Targets" : "Edit Targets"}
          </button>

          <button onClick={handleExport} className="metallic-button rounded-xl px-6 py-3 font-semibold text-black">
            Export KPI Summary
          </button>
        </div>

        {period !== "All Time" && (
          <p className="mt-4 text-xs text-[#A5ADB8]">
            Period filtering applies to income and expense figures. Balances such as net worth,
            debt, and investments always reflect current values.
          </p>
        )}
      </Panel>

      {editingTargets && (
        <Panel title="KPI Targets">
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Savings Rate %" type="number" value={targets.savingsRate} onChange={(v) => updateTarget("savingsRate", Number(v))} />
            <Input label="Expense Ratio %" type="number" value={targets.expenseRatio} onChange={(v) => updateTarget("expenseRatio", Number(v))} />
            <Input label="Cash Flow Margin %" type="number" value={targets.cashFlowMargin} onChange={(v) => updateTarget("cashFlowMargin", Number(v))} />
            <Input label="Emergency Fund (months)" type="number" value={targets.emergencyFundMonths} onChange={(v) => updateTarget("emergencyFundMonths", Number(v))} />
            <Input label="Debt-to-Income %" type="number" value={targets.debtToIncome} onChange={(v) => updateTarget("debtToIncome", Number(v))} />
            <Input label="Budget Adherence %" type="number" value={targets.budgetAdherence} onChange={(v) => updateTarget("budgetAdherence", Number(v))} />
            <Input label="Savings Goal Progress %" type="number" value={targets.savingsGoalProgress} onChange={(v) => updateTarget("savingsGoalProgress", Number(v))} />
            <Input label="Investment Return %" type="number" value={targets.investmentReturn} onChange={(v) => updateTarget("investmentReturn", Number(v))} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button onClick={handleSaveTargets} className="metallic-button rounded-xl px-6 py-3 font-semibold text-black">
              Save Targets
            </button>
            <button onClick={handleResetTargets} className="rounded-xl border border-[#BFC4CC]/30 px-6 py-3 font-semibold text-[#D5D8DD] hover:bg-white/5">
              Reset Targets
            </button>
            {savedMessage && <p className="text-sm text-[#34D399]">{savedMessage}</p>}
          </div>
        </Panel>
      )}

      <Panel title="Financial Health">
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <div className="min-w-0 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-5xl font-bold" style={{ color: kpis.healthClassification.color }}>
                {Math.round(kpis.healthScore)}/100
              </h3>
              <span
                className="rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${kpis.healthClassification.color}26`, color: kpis.healthClassification.color }}
              >
                {kpis.healthClassification.label}
              </span>
            </div>

            <div className="mt-4">
              <KPIProgressBar value={kpis.healthScore} color={kpis.healthClassification.color} />
            </div>

            <p className="mt-4 text-[#D5D8DD]">{kpis.healthClassification.description}</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#BFC4CC]/20 bg-black/30 p-3">
                <p className="text-xs uppercase tracking-wide text-[#A5ADB8]">Strongest Area</p>
                <p className="mt-1 font-semibold text-[#34D399]">{kpis.strongestArea.label}</p>
              </div>
              <div className="rounded-xl border border-[#BFC4CC]/20 bg-black/30 p-3">
                <p className="text-xs uppercase tracking-wide text-[#A5ADB8]">Weakest Area</p>
                <p className="mt-1 font-semibold text-[#F87171]">{kpis.weakestArea.label}</p>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <KPIRadarChart data={radarData} height={280} />
          </div>
        </div>
      </Panel>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mainCards.map((card) => (
          <KPICard
            key={card.key}
            title={card.title}
            value={card.value}
            target={card.target}
            gap={card.gap}
            status={card.status}
            explanation={card.explanation}
            progressValue={card.progressValue}
            icon={card.icon}
          />
        ))}
      </section>

      <Panel title="Secondary Metrics">
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            title="Total Income"
            value={formatCurrency(kpis.totalIncome)}
            subtitle={<MultiCurrencyAmount amount={kpis.totalIncome} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />
          <Card
            title="Total Expenses"
            value={formatCurrency(kpis.totalExpenses)}
            subtitle={<MultiCurrencyAmount amount={kpis.totalExpenses} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />
          <Card
            title="Free Cash Flow"
            value={formatCurrency(kpis.freeCashFlow)}
            subtitle={<MultiCurrencyAmount amount={kpis.freeCashFlow} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />
          <Card
            title="Total Debt"
            value={formatCurrency(kpis.totalDebt)}
            subtitle={<MultiCurrencyAmount amount={kpis.totalDebt} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />
          <Card
            title="Monthly Debt Payments"
            value={formatCurrency(kpis.monthlyDebtPayments)}
            subtitle={<MultiCurrencyAmount amount={kpis.monthlyDebtPayments} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />
          <Card title="Savings Goal Progress" value={formatPercent(kpis.savingsGoalProgress)} />
          <Card title="Goal Completion Rate" value={formatPercent(kpis.goalCompletionRate)} />
          <Card title="Investment Return" value={formatPercent(kpis.investmentReturn)} />
          <Card
            title="Investment Profit/Loss"
            value={formatCurrency(kpis.investmentProfit)}
            subtitle={<MultiCurrencyAmount amount={kpis.investmentProfit} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />
          <Card
            title="Portfolio Concentration"
            value={`${kpis.portfolioConcentration.pct.toFixed(1)}%`}
            subtitle={`Risk: ${kpis.portfolioConcentration.risk}${kpis.portfolioConcentration.topType ? ` (${kpis.portfolioConcentration.topType})` : ""}`}
          />
        </div>
      </Panel>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="KPI Target vs Actual">
          <div className="mt-6">
            <KPIComparisonChart data={comparisonData} />
          </div>
        </Panel>

        <Panel title="Financial Performance Overview">
          <div className="mt-6">
            <KPITrendChart data={performanceData} />
          </div>
        </Panel>

        <Panel title="Financial Position Overview">
          <div className="mt-6">
            <KPITrendChart data={positionData} />
          </div>
        </Panel>

        <Panel title="Goal and Savings Progress">
          <div className="mt-6 space-y-4">
            {savingsPlans.length === 0 && goals.length === 0 ? (
              <p className="text-[#A5ADB8]">No goals or savings plans tracked yet.</p>
            ) : (
              <>
                {savingsPlans.map((plan) => {
                  const progress = clamp(
                    Number(plan.target) > 0 ? (Number(plan.current || 0) / Number(plan.target)) * 100 : 0,
                    0,
                    100
                  )
                  return (
                    <div key={plan.id}>
                      <div className="flex items-center justify-between text-sm text-[#D5D8DD]">
                        <span>{plan.name}</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2">
                        <KPIProgressBar value={progress} color="#06B6D4" />
                      </div>
                    </div>
                  )
                })}

                {goals.map((goal) => {
                  const progress = clamp(
                    Number(goal.target) > 0 ? (Number(goal.saved || 0) / Number(goal.target)) * 100 : 0,
                    0,
                    100
                  )
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between text-sm text-[#D5D8DD]">
                        <span>{goal.name}</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2">
                        <KPIProgressBar value={progress} color="#8B5CF6" />
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </Panel>
      </section>

      <Panel title="Insights">
        <div className="mt-6 space-y-3">
          {insights.length === 0 ? (
            <p className="text-[#A5ADB8]">No notable insights right now — your KPIs are within expected ranges.</p>
          ) : (
            insights.map((insight) => <KPIInsightCard key={insight.id} insight={insight} />)
          )}
        </div>
      </Panel>
    </div>
  )
}
