import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import useRetirement from "../hooks/useRetirement"

export default function RetirementPlanner() {
  const {
    currentAge,
    setCurrentAge,
    retirementAge,
    setRetirementAge,
    currentSavings,
    setCurrentSavings,
    monthlyContribution,
    setMonthlyContribution,
    annualReturn,
    setAnnualReturn,
    yearsLeft,
    projectedValue,
  } = useRetirement()

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Years Left" value={yearsLeft} />

        <Card
          title="Monthly Contribution"
          value={`SRD ${Number(monthlyContribution).toLocaleString()}`}
        />

        <Card title="Expected Return" value={`${annualReturn}%`} />

        <Card
          title="Projected Value"
          value={`SRD ${projectedValue.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Retirement Inputs">
          <div className="mt-6 space-y-4">
            <Input
              label="Current Age"
              type="number"
              value={currentAge}
              onChange={(value) => setCurrentAge(Number(value))}
            />

            <Input
              label="Retirement Age"
              type="number"
              value={retirementAge}
              onChange={(value) => setRetirementAge(Number(value))}
            />

            <Input
              label="Current Savings"
              type="number"
              value={currentSavings}
              onChange={(value) => setCurrentSavings(Number(value))}
            />

            <Input
              label="Monthly Contribution"
              type="number"
              value={monthlyContribution}
              onChange={(value) => setMonthlyContribution(Number(value))}
            />

            <Input
              label="Expected Annual Return %"
              type="number"
              value={annualReturn}
              onChange={(value) => setAnnualReturn(Number(value))}
            />
          </div>
        </Panel>

        <Panel title="Retirement Projection">
          <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
            <p className="text-sm text-[#A5ADB8]">
              Projected Retirement Value
            </p>

            <h2 className="mt-2 text-5xl font-bold text-[#FBBF24]">
              SRD{" "}
              {projectedValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </h2>

            <p className="mt-4 text-[#D5D8DD]">
              Based on {yearsLeft} years, SRD{" "}
              {Number(monthlyContribution).toLocaleString()} monthly
              contribution, and {annualReturn}% annual return.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  )
}