import { useMemo, useState } from "react"
import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"

export default function LoanPayoffCalculator() {
  const [loanBalance, setLoanBalance] = useState(25000)
  const [annualRate, setAnnualRate] = useState(12)
  const [monthlyPayment, setMonthlyPayment] = useState(850)

  const result = useMemo(() => {
    let balance = Number(loanBalance || 0)
    const monthlyRate = Number(annualRate || 0) / 100 / 12
    const payment = Number(monthlyPayment || 0)

    let months = 0
    let totalInterest = 0

    if (balance <= 0 || payment <= 0) {
      return { months: 0, totalInterest: 0, totalPaid: 0 }
    }

    while (balance > 0 && months < 600) {
      const interest = balance * monthlyRate
      totalInterest += interest
      balance = balance + interest - payment
      months++
    }

    return {
      months,
      totalInterest,
      totalPaid: Number(loanBalance || 0) + totalInterest,
    }
  }, [loanBalance, annualRate, monthlyPayment])

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Loan Balance" value={`SRD ${Number(loanBalance).toLocaleString()}`} />
        <Card title="Interest Rate" value={`${annualRate}%`} />
        <Card title="Months Left" value={result.months} />
        <Card title="Total Interest" value={`SRD ${result.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Loan Inputs">
          <div className="mt-6 space-y-4">
            <Input label="Loan Balance" type="number" value={loanBalance} onChange={(value) => setLoanBalance(Number(value))} />
            <Input label="Annual Interest Rate %" type="number" value={annualRate} onChange={(value) => setAnnualRate(Number(value))} />
            <Input label="Monthly Payment" type="number" value={monthlyPayment} onChange={(value) => setMonthlyPayment(Number(value))} />
          </div>
        </Panel>

        <Panel title="Payoff Projection">
          <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
            <p className="text-sm text-[#A5ADB8]">Estimated Payoff Time</p>
            <h2 className="mt-2 text-5xl font-bold text-[#FBBF24]">
              {result.months} months
            </h2>

            <p className="mt-4 text-[#D5D8DD]">
              At SRD {Number(monthlyPayment).toLocaleString()} per month, this loan
              will be paid off in about {result.months} months.
            </p>

            <p className="mt-4 text-[#F87171]">
              Total interest paid: SRD{" "}
              {result.totalInterest.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </Panel>
      </section>
    </div>
  )
}