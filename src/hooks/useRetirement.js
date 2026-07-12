import { useMemo, useState } from "react"

export default function useRetirement() {
  const [currentAge, setCurrentAge] = useState(28)
  const [retirementAge, setRetirementAge] = useState(40)
  const [currentSavings, setCurrentSavings] = useState(5000)
  const [monthlyContribution, setMonthlyContribution] = useState(1500)
  const [annualReturn, setAnnualReturn] = useState(8)

  const yearsLeft = retirementAge - currentAge

  const projectedValue = useMemo(() => {
    const months = yearsLeft * 12
    const monthlyRate = annualReturn / 100 / 12

    let total = Number(currentSavings)

    for (let i = 0; i < months; i++) {
      total = total * (1 + monthlyRate)
      total += Number(monthlyContribution)
    }

    return total
  }, [
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    annualReturn,
  ])

  return {
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
  }
}