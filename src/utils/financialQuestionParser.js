const MONTHS_EN = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7,
  september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10, nov: 10,
  december: 11, dec: 11,
}

const MONTHS_NL = {
  januari: 0, februari: 1, maart: 2, april: 3, mei: 4, juni: 5, juli: 6,
  augustus: 7, september: 8, oktober: 9, november: 10, december: 11,
}

const MONTH_LABELS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const MONTH_LABELS_NL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
]

const DUTCH_HINT_WORDS = [
  "wat", "waren", "mijn", "uitgaven", "hoeveel", "heb", "ik", "gespaard",
  "nettovermogen", "welke", "rekening", "moet", "binnenkort", "betalen",
  "schuld", "hoe", "presteert", "beleggingsportefeuille", "deze", "maand",
  "spaarpercentage", "aflossen", "noodfonds", "voldoende", "portefeuille",
  "pensioen", "schema", "is", "geef", "leg", "uit", "kan", "verbeteren",
]

export function detectLanguage(text) {
  const lower = (text || "").toLowerCase()
  const hits = DUTCH_HINT_WORDS.filter((word) => new RegExp(`\\b${word}\\b`).test(lower)).length
  return hits >= 2 ? "nl" : "en"
}

export function parseDateReference(text) {
  const lower = (text || "").toLowerCase()
  const yearMatch = lower.match(/\b(19|20)\d{2}\b/)
  const year = yearMatch ? Number(yearMatch[0]) : null

  const allMonths = { ...MONTHS_EN, ...MONTHS_NL }
  let month = null

  for (const [name, index] of Object.entries(allMonths)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) {
      month = index
      break
    }
  }

  return { month, year }
}

function monthLabel(index, language) {
  return language === "nl" ? MONTH_LABELS_NL[index] : MONTH_LABELS_EN[index]
}

function money(value) {
  return `SRD ${Number(value || 0).toFixed(2)}`
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function safeDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function currentMonthRange() {
  const now = new Date()
  return { month: now.getMonth(), year: now.getFullYear() }
}

function filterTransactionsByMonth(transactions, month, year, type) {
  const valid = []
  let skippedInvalid = 0

  transactions.forEach((item) => {
    const date = safeDate(item.date)
    if (!date) {
      skippedInvalid += 1
      return
    }
    if (date.getMonth() === month && date.getFullYear() === year && (!type || item.type === type)) {
      valid.push(item)
    }
  })

  return { matches: valid, skippedInvalid }
}

function categoryBreakdown(items) {
  const totals = {}
  items.forEach((item) => {
    const category = item.category || "Uncategorized"
    totals[category] = (totals[category] || 0) + Number(item.amount || 0)
  })
  return Object.entries(totals).sort((a, b) => b[1] - a[1])
}

function largestTransaction(items) {
  if (items.length === 0) return null
  return items.reduce((max, item) => (Number(item.amount || 0) > Number(max.amount || 0) ? item : max), items[0])
}

const L = {
  en: {
    noRecords: (label) => `I couldn't find any recorded transactions for ${label}.`,
    invalidDatesNote: (n) => ` (${n} transaction${n === 1 ? "" : "s"} had missing or invalid dates and were excluded.)`,
    expensesHeader: (label, total, count) =>
      `In ${label} you recorded ${count} expense transaction${count === 1 ? "" : "s"} totaling ${money(total)}.`,
    incomeHeader: (label, total, count) =>
      `In ${label} you recorded ${count} income transaction${count === 1 ? "" : "s"} totaling ${money(total)}.`,
    topCategories: "Top categories: ",
    largestExpense: (item) => `Largest expense: ${item.category || "Uncategorized"} — ${money(item.amount)}.`,
    savedThisMonth: (label, amount) =>
      amount >= 0
        ? `You saved ${money(amount)} in ${label} (income minus expenses).`
        : `You spent ${money(Math.abs(amount))} more than you earned in ${label}.`,
    netWorth: (nw, assets, liabilities) =>
      `Your current net worth is ${money(nw)} (${money(assets)} in assets minus ${money(liabilities)} in liabilities).`,
    highestBudget: (category, amount) => `Your highest budget category is "${category}" at ${money(amount)}.`,
    noBudgets: "You don't have any budget categories set up yet.",
    billDueNext: (name, days, amount) =>
      days < 0
        ? `${name} was due ${Math.abs(days)} day(s) ago — amount ${money(amount)}.`
        : `The next bill due is "${name}" in ${days} day${days === 1 ? "" : "s"} — amount ${money(amount)}.`,
    noBillsUpcoming: "You don't have any bills with a valid due date recorded yet.",
    totalDebt: (total, count) =>
      `You currently have ${money(total)} in total debt across ${count} debt account${count === 1 ? "" : "s"}.`,
    noDebt: "You don't have any debt recorded — you're debt-free.",
    portfolio: (ret, profit, value) =>
      `Your investment portfolio is worth ${money(value)}, with a return of ${pct(ret)} (${profit >= 0 ? "profit" : "loss"} of ${money(Math.abs(profit))}).`,
    noInvestments: "You don't have any investments recorded yet.",
    retirement: (score, label, progress) =>
      `Your Financial Health Score is ${Math.round(score)}/100 (${label}) and your savings goal progress is ${pct(progress)}. Staying consistent with contributions is the biggest lever for retirement readiness.`,
    goalClosest: (name, progress) => `"${name}" is your closest goal to completion, at ${pct(progress)}.`,
    goalDone: (name) => `"${name}" is already complete — congratulations!`,
    noGoals: "You don't have any financial goals set up yet.",
    health: (score, label, strongest, weakest) =>
      `Your Financial Health Score is ${Math.round(score)}/100 (${label}). Strongest area: ${strongest}. Area needing attention: ${weakest}.`,
    unsupported:
      "I don't have a specific answer for that yet. Try asking about your income, expenses, net worth, budget, savings, debt, bills, investments, or your financial health score — or ask a general financial education question.",
  },
  nl: {
    noRecords: (label) => `Ik kon geen transacties vinden voor ${label}.`,
    invalidDatesNote: (n) => ` (${n} transactie${n === 1 ? "" : "s"} had(den) ontbrekende of ongeldige datums en is/zijn uitgesloten.)`,
    expensesHeader: (label, total, count) =>
      `In ${label} had je ${count} uitgave${count === 1 ? "" : "n"} met een totaal van ${money(total)}.`,
    incomeHeader: (label, total, count) =>
      `In ${label} had je ${count} inkomsten${count === 1 ? "post" : "posten"} met een totaal van ${money(total)}.`,
    topCategories: "Grootste categorieën: ",
    largestExpense: (item) => `Grootste uitgave: ${item.category || "Overig"} — ${money(item.amount)}.`,
    savedThisMonth: (label, amount) =>
      amount >= 0
        ? `Je hebt ${money(amount)} gespaard in ${label} (inkomen minus uitgaven).`
        : `Je hebt ${money(Math.abs(amount))} meer uitgegeven dan verdiend in ${label}.`,
    netWorth: (nw, assets, liabilities) =>
      `Je huidige nettovermogen is ${money(nw)} (${money(assets)} aan bezittingen minus ${money(liabilities)} aan schulden).`,
    highestBudget: (category, amount) => `Je hoogste budgetcategorie is "${category}" met ${money(amount)}.`,
    noBudgets: "Je hebt nog geen budgetcategorieën ingesteld.",
    billDueNext: (name, days, amount) =>
      days < 0
        ? `"${name}" moest ${Math.abs(days)} dag(en) geleden betaald worden — bedrag ${money(amount)}.`
        : `De eerstvolgende rekening is "${name}", over ${days} dag${days === 1 ? "" : "en"} — bedrag ${money(amount)}.`,
    noBillsUpcoming: "Je hebt nog geen rekeningen met een geldige vervaldatum.",
    totalDebt: (total, count) =>
      `Je hebt momenteel ${money(total)} aan totale schuld verdeeld over ${count} schuldpost${count === 1 ? "" : "en"}.`,
    noDebt: "Je hebt geen geregistreerde schulden — je bent schuldenvrij.",
    portfolio: (ret, profit, value) =>
      `Je beleggingsportefeuille is ${money(value)} waard, met een rendement van ${pct(ret)} (${profit >= 0 ? "winst" : "verlies"} van ${money(Math.abs(profit))}).`,
    noInvestments: "Je hebt nog geen beleggingen geregistreerd.",
    retirement: (score, label, progress) =>
      `Je Financial Health Score is ${Math.round(score)}/100 (${label}) en je spaardoelvoortgang is ${pct(progress)}. Consistent bijdragen is de belangrijkste hefboom voor pensioengereedheid.`,
    goalClosest: (name, progress) => `"${name}" staat het dichtst bij voltooiing, op ${pct(progress)}.`,
    goalDone: (name) => `"${name}" is al voltooid — gefeliciteerd!`,
    noGoals: "Je hebt nog geen financiële doelen ingesteld.",
    health: (score, label, strongest, weakest) =>
      `Je Financial Health Score is ${Math.round(score)}/100 (${label}). Sterkste gebied: ${strongest}. Aandachtsgebied: ${weakest}.`,
    unsupported:
      "Daar heb ik nog geen specifiek antwoord op. Vraag gerust naar je inkomen, uitgaven, nettovermogen, budget, sparen, schulden, rekeningen, beleggingen of je financial health score — of stel een algemene financiële vraag.",
  },
}

function answerDateAwareQuestion(lower, language, context, month, year) {
  const t = L[language]
  const label = `${monthLabel(month, language)} ${year}`
  const isExpense = /uitgaven|expense|spent|spend|kosten/.test(lower)
  const type = isExpense ? "expense" : "income"

  const { matches, skippedInvalid } = filterTransactionsByMonth(context.transactions, month, year, type)

  if (matches.length === 0) {
    return t.noRecords(label) + (skippedInvalid > 0 ? t.invalidDatesNote(skippedInvalid) : "")
  }

  const total = matches.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const header = isExpense ? t.expensesHeader(label, total, matches.length) : t.incomeHeader(label, total, matches.length)

  let body = header
  if (isExpense) {
    const breakdown = categoryBreakdown(matches)
      .slice(0, 5)
      .map(([category, amount]) => `${category} (${money(amount)})`)
      .join(", ")
    const largest = largestTransaction(matches)

    body += ` ${t.topCategories}${breakdown}.`
    if (largest) body += ` ${t.largestExpense(largest)}`
  }

  if (skippedInvalid > 0) body += t.invalidDatesNote(skippedInvalid)

  return body
}

function answerThisMonthSavings(language, context) {
  const t = L[language]
  const { month, year } = currentMonthRange()
  const income = filterTransactionsByMonth(context.transactions, month, year, "income").matches.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )
  const expenses = filterTransactionsByMonth(context.transactions, month, year, "expense").matches.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )
  const label = monthLabel(month, language)
  return t.savedThisMonth(label, income - expenses)
}

function answerNetWorth(language, context) {
  const t = L[language]
  return t.netWorth(context.kpis.netWorth, context.kpis.totalAssets, context.kpis.totalLiabilities)
}

function answerHighestBudget(language, context) {
  const t = L[language]
  if (context.budgets.length === 0) return t.noBudgets
  const top = context.budgets.reduce(
    (max, item) => (Number(item.amount || 0) > Number(max.amount || 0) ? item : max),
    context.budgets[0]
  )
  return t.highestBudget(top.category, top.amount)
}

function answerBillsDue(language, context) {
  const t = L[language]
  const now = new Date()
  const withDates = context.bills
    .map((bill) => ({ bill, date: safeDate(bill.dueDate) }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date)

  if (withDates.length === 0) return t.noBillsUpcoming

  const next = withDates[0]
  const days = Math.ceil((next.date - now) / (1000 * 60 * 60 * 24))
  return t.billDueNext(next.bill.name, days, next.bill.amount)
}

function answerDebt(language, context) {
  const t = L[language]
  const total = context.kpis.totalDebt
  if (total <= 0) return t.noDebt
  return t.totalDebt(total, context.debts.length)
}

function answerInvestments(language, context) {
  const t = L[language]
  if (context.investments.length === 0) return t.noInvestments
  return t.portfolio(context.kpis.investmentReturn, context.kpis.investmentProfit, context.kpis.investmentValue)
}

function answerRetirement(language, context) {
  const t = L[language]
  return t.retirement(context.kpis.healthScore, context.kpis.healthClassification.label, context.kpis.savingsGoalProgress)
}

function answerGoalClosest(language, context) {
  const t = L[language]
  if (context.goals.length === 0) return t.noGoals

  const withProgress = context.goals.map((goal) => ({
    goal,
    progress: Number(goal.target || 0) > 0 ? (Number(goal.saved || 0) / Number(goal.target || 0)) * 100 : 0,
  }))

  const incomplete = withProgress.filter((item) => item.progress < 100)
  if (incomplete.length === 0) return t.goalDone(withProgress[0].goal.name)

  const closest = incomplete.reduce((best, item) => (item.progress > best.progress ? item : best), incomplete[0])
  return t.goalClosest(closest.goal.name, closest.progress)
}

function answerHealth(language, context) {
  const t = L[language]
  return t.health(
    context.kpis.healthScore,
    context.kpis.healthClassification.label,
    context.kpis.strongestArea.label,
    context.kpis.weakestArea.label
  )
}

export function answerPlatformQuestion(question, language, context) {
  const lower = question.toLowerCase()
  const { month, year } = parseDateReference(lower)

  if (month !== null && /uitgaven|expense|spent|spend|income|inkomen|inkomsten/.test(lower)) {
    return answerDateAwareQuestion(lower, language, context, month, year ?? new Date().getFullYear())
  }

  if (/(deze maand|this month)/.test(lower) && /(gespaard|saved|saving)/.test(lower)) {
    return answerThisMonthSavings(language, context)
  }

  if (/nettovermogen|net worth/.test(lower)) {
    return answerNetWorth(language, context)
  }

  if (/(hoogste|highest).*(budget|categorie|category)|budget.*(hoogste|highest)/.test(lower)) {
    return answerHighestBudget(language, context)
  }

  if (/(bill|rekening).*(due|betalen|binnenkort|next|volgende)|due.*(bill|soon)/.test(lower)) {
    return answerBillsDue(language, context)
  }

  if (/schuld|\bdebt\b/.test(lower)) {
    return answerDebt(language, context)
  }

  if (/investment|belegging|portfolio|portefeuille/.test(lower)) {
    return answerInvestments(language, context)
  }

  if (/retirement|pensioen|on track|schema/.test(lower)) {
    return answerRetirement(language, context)
  }

  if (/(goal|doel).*(closest|complet|dichtst|voltooi)/.test(lower)) {
    return answerGoalClosest(language, context)
  }

  if (/health score|financial health|kpi|gezondheidsscore/.test(lower)) {
    return answerHealth(language, context)
  }

  return null
}

const EDUCATION_DISCLAIMER = {
  en: "Money AI provides educational financial information and planning support. It does not provide licensed financial, investment, tax, or legal advice.",
  nl: "Money AI biedt educatieve financiële informatie en planningsondersteuning. Het is geen gelicentieerd financieel, beleggings-, belasting- of juridisch advies.",
}

const EDUCATION_TOPICS = [
  {
    key: "warrenBuffett",
    keywords: ["warren buffett", "buffett"],
    en: {
      title: "Warren Buffett's General Investment Principles",
      explanation:
        "Warren Buffett is widely associated with a small set of long-term, value-oriented principles rather than any single specific investment recommendation.",
      steps: [
        "Understand the business before buying — invest only in what you can reasonably explain.",
        "Think like a long-term owner, not a short-term trader.",
        "Look for a margin of safety: buy below your estimate of intrinsic value.",
        "Favor businesses with durable competitive advantages ('moats').",
        "Apply disciplined valuation rather than chasing hype.",
        "Avoid unnecessary trading and the costs/taxes that come with it.",
      ],
      risks: [
        "Past performance of any investor or strategy does not guarantee future results.",
        "Concentrated, long-term positions carry real downside risk if the underlying business deteriorates.",
      ],
      considerations: [
        "What is your own time horizon and risk tolerance?",
        "Do you understand the business well enough to hold through volatility?",
      ],
    },
    nl: {
      title: "Algemene beleggingsprincipes geassocieerd met Warren Buffett",
      explanation:
        "Warren Buffett wordt vooral geassocieerd met een aantal langetermijn-, waardegerichte principes, niet met specifieke beleggingsadviezen voor een individuele situatie.",
      steps: [
        "Begrijp het bedrijf voordat je koopt — beleg alleen in wat je redelijk kunt uitleggen.",
        "Denk als langetermijneigenaar, niet als korte-termijnhandelaar.",
        "Zoek een veiligheidsmarge: koop onder je geschatte intrinsieke waarde.",
        "Geef de voorkeur aan bedrijven met duurzame concurrentievoordelen.",
        "Pas gedisciplineerde waardering toe in plaats van hypes te volgen.",
        "Vermijd onnodig handelen en de kosten/belastingen die daarbij komen kijken.",
      ],
      risks: [
        "Prestaties uit het verleden van welke belegger of strategie dan ook garanderen geen toekomstige resultaten.",
        "Geconcentreerde langetermijnposities brengen reëel neerwaarts risico met zich mee als het onderliggende bedrijf verslechtert.",
      ],
      considerations: [
        "Wat is jouw eigen tijdshorizon en risicotolerantie?",
        "Begrijp je het bedrijf goed genoeg om het vast te houden tijdens volatiliteit?",
      ],
    },
  },
  {
    key: "budgeting",
    keywords: ["budget", "budgeting", "budgetteren"],
    en: {
      title: "Budgeting",
      explanation: "A budget is a plan that matches your income to your expenses and savings goals ahead of time.",
      steps: [
        "List all income sources and their monthly amounts.",
        "Categorize recurring expenses (needs, wants, savings).",
        "Set a spending limit per category and track actual spending against it.",
      ],
      risks: ["An unrealistic budget is easy to abandon.", "Irregular income makes fixed budgets harder to apply."],
      considerations: ["Which expense categories vary most month to month?", "How often will you review and adjust the budget?"],
    },
    nl: {
      title: "Budgetteren",
      explanation: "Een budget is een vooraf gemaakt plan dat je inkomen afstemt op je uitgaven en spaardoelen.",
      steps: [
        "Noteer alle inkomstenbronnen en hun maandelijkse bedragen.",
        "Categoriseer terugkerende uitgaven (noodzaak, wensen, sparen).",
        "Stel een uitgavenlimiet per categorie in en volg de werkelijke uitgaven.",
      ],
      risks: ["Een onrealistisch budget wordt snel losgelaten.", "Onregelmatig inkomen maakt vaste budgetten lastiger toepasbaar."],
      considerations: ["Welke uitgavencategorieën variëren het meest per maand?", "Hoe vaak ga je het budget evalueren en aanpassen?"],
    },
  },
  {
    key: "saving",
    keywords: ["saving", "save more", "sparen", "besparen"],
    en: {
      title: "Saving",
      explanation: "Saving is setting aside a portion of income for future needs instead of spending it now.",
      steps: [
        "Automate a transfer to savings right after payday.",
        "Start with a small, consistent percentage and increase it over time.",
        "Separate savings from your everyday spending account.",
      ],
      risks: ["Keeping savings in cash long-term can lose purchasing power to inflation."],
      considerations: ["What percentage of income can you realistically save each month?", "What is this savings pool for — short or long term?"],
    },
    nl: {
      title: "Sparen",
      explanation: "Sparen betekent een deel van je inkomen opzijzetten voor toekomstige behoeften in plaats van het nu uit te geven.",
      steps: [
        "Automatiseer een overboeking naar sparen direct na je salarisbetaling.",
        "Begin met een klein, consistent percentage en verhoog dit geleidelijk.",
        "Houd spaargeld gescheiden van je dagelijkse betaalrekening.",
      ],
      risks: ["Spaargeld langdurig in cash aanhouden kan koopkracht verliezen door inflatie."],
      considerations: ["Welk percentage van je inkomen kun je realistisch elke maand sparen?", "Waarvoor is dit spaargeld bedoeld — kort of lang termijn?"],
    },
  },
  {
    key: "emergencyFund",
    keywords: ["emergency fund", "noodfonds"],
    en: {
      title: "Emergency Funds",
      explanation: "An emergency fund is cash set aside to cover essential expenses if income is interrupted or an unexpected cost arises.",
      steps: [
        "Estimate 3-6 months of essential monthly expenses.",
        "Build the fund gradually with automatic transfers.",
        "Keep it in an easily accessible account, separate from investments.",
      ],
      risks: ["Underfunding it leaves you exposed to debt when a shock occurs.", "Overfunding it may mean missed growth from investing elsewhere."],
      considerations: ["How stable is your income?", "What would you consider a true emergency versus a want?"],
    },
    nl: {
      title: "Noodfonds",
      explanation: "Een noodfonds is geld dat apart staat om essentiële uitgaven te dekken als je inkomen wegvalt of een onverwachte kost zich voordoet.",
      steps: [
        "Schat 3 tot 6 maanden essentiële maandelijkse uitgaven in.",
        "Bouw het fonds geleidelijk op met automatische overboekingen.",
        "Houd het op een gemakkelijk toegankelijke rekening, gescheiden van beleggingen.",
      ],
      risks: ["Een te klein noodfonds maakt je kwetsbaar voor schulden bij een tegenslag.", "Een te groot noodfonds kan groeikansen elders mislopen."],
      considerations: ["Hoe stabiel is jouw inkomen?", "Wat beschouw jij als een echte noodsituatie versus een wens?"],
    },
  },
  {
    key: "investing",
    keywords: ["invest", "investing", "investeren", "beleggen"],
    en: {
      title: "Investing",
      explanation: "Investing means putting money into assets expected to grow in value or generate income over time, in exchange for taking on risk.",
      steps: [
        "Clarify your time horizon and risk tolerance first.",
        "Favor broad diversification over concentrated bets when starting out.",
        "Keep costs (fees, taxes) low and review your allocation periodically.",
      ],
      risks: ["Markets can decline significantly and unpredictably.", "Concentrated positions amplify both gains and losses."],
      considerations: ["How many years until you'll need this money?", "How would you react to a 20-30% drop in value?"],
    },
    nl: {
      title: "Beleggen",
      explanation: "Beleggen betekent geld inzetten in bezittingen die naar verwachting in waarde groeien of inkomen genereren, in ruil voor risico.",
      steps: [
        "Bepaal eerst je tijdshorizon en risicotolerantie.",
        "Geef bij het starten de voorkeur aan brede spreiding boven geconcentreerde posities.",
        "Houd kosten (fees, belastingen) laag en evalueer je allocatie periodiek.",
      ],
      risks: ["Markten kunnen aanzienlijk en onvoorspelbaar dalen.", "Geconcentreerde posities versterken zowel winsten als verliezen."],
      considerations: ["Hoeveel jaar heb je voordat je dit geld nodig hebt?", "Hoe zou je reageren op een waardedaling van 20-30%?"],
    },
  },
  {
    key: "compoundInterest",
    keywords: ["compound interest", "samengestelde rente"],
    en: {
      title: "Compound Interest",
      explanation: "Compound interest is growth calculated on both the original amount and the interest already earned, accelerating gains over time.",
      steps: [
        "Start as early as possible — time is the biggest multiplier.",
        "Reinvest returns rather than withdrawing them.",
        "Contribute consistently, even in small amounts.",
      ],
      risks: ["Compounding also works in reverse with high-interest debt."],
      considerations: ["What rate of return and time horizon are you assuming?"],
    },
    nl: {
      title: "Samengestelde rente",
      explanation: "Samengestelde rente is groei berekend over zowel het oorspronkelijke bedrag als de al verdiende rente, waardoor groei versnelt over tijd.",
      steps: [
        "Begin zo vroeg mogelijk — tijd is de grootste vermenigvuldiger.",
        "Herinvesteer rendementen in plaats van ze op te nemen.",
        "Draag consistent bij, ook in kleine bedragen.",
      ],
      risks: ["Samengestelde groei werkt ook averechts bij schulden met hoge rente."],
      considerations: ["Welk rendement en welke tijdshorizon neem je aan?"],
    },
  },
  {
    key: "debtReduction",
    keywords: ["debt reduction", "pay off debt", "schuld aflossen", "schulden aflossen"],
    en: {
      title: "Debt Reduction",
      explanation: "Debt reduction strategies focus on paying down balances systematically to reduce interest cost and financial risk.",
      steps: [
        "List all debts with balance, interest rate, and minimum payment.",
        "Pay minimums on everything, then direct extra funds using either the avalanche (highest rate first) or snowball (smallest balance first) method.",
        "Avoid taking on new high-interest debt while paying down existing balances.",
      ],
      risks: ["Missing minimum payments can damage credit and add fees."],
      considerations: ["Which method keeps you more motivated — avalanche or snowball?"],
    },
    nl: {
      title: "Schuldafbouw",
      explanation: "Strategieën voor schuldafbouw richten zich op het systematisch aflossen van saldi om rentekosten en financieel risico te verminderen.",
      steps: [
        "Maak een lijst van alle schulden met saldo, rentepercentage en minimumbetaling.",
        "Betaal overal het minimum en zet extra geld in via de avalanche-methode (hoogste rente eerst) of de sneeuwbalmethode (kleinste saldo eerst).",
        "Vermijd nieuwe schulden met hoge rente terwijl je bestaande saldi aflost.",
      ],
      risks: ["Het missen van minimumbetalingen kan je kredietscore schaden en extra kosten opleveren."],
      considerations: ["Welke methode houdt jou meer gemotiveerd — avalanche of sneeuwbal?"],
    },
  },
  {
    key: "retirementPlanning",
    keywords: ["retirement planning", "pensioenplanning"],
    en: {
      title: "Retirement Planning",
      explanation: "Retirement planning estimates how much you'll need later in life and builds a savings/investment path to get there.",
      steps: [
        "Estimate your target retirement age and expected annual expenses.",
        "Account for other income sources (pension, social security, rental income).",
        "Contribute consistently and increase contributions as income grows.",
      ],
      risks: ["Underestimating inflation or lifespan can leave a shortfall."],
      considerations: ["At what age do you want to retire, and how flexible is that date?"],
    },
    nl: {
      title: "Pensioenplanning",
      explanation: "Pensioenplanning schat in hoeveel je later nodig hebt en bouwt een spaar-/beleggingspad om daar te komen.",
      steps: [
        "Schat je gewenste pensioenleeftijd en verwachte jaarlijkse uitgaven in.",
        "Houd rekening met andere inkomstenbronnen (pensioen, uitkering, huurinkomsten).",
        "Draag consistent bij en verhoog bijdragen naarmate je inkomen groeit.",
      ],
      risks: ["Inflatie of levensverwachting onderschatten kan tot een tekort leiden."],
      considerations: ["Op welke leeftijd wil je met pensioen, en hoe flexibel is die datum?"],
    },
  },
  {
    key: "inflation",
    keywords: ["inflation", "inflatie"],
    en: {
      title: "Inflation",
      explanation: "Inflation is the general rise in prices over time, which reduces the purchasing power of a fixed amount of money.",
      steps: [
        "Compare savings and investment returns against inflation, not just in absolute terms.",
        "Favor assets with historical inflation-beating potential for long-term goals.",
      ],
      risks: ["Cash sitting idle for years can lose real value even while the number stays the same."],
      considerations: ["Is your investment return likely to outpace inflation over your time horizon?"],
    },
    nl: {
      title: "Inflatie",
      explanation: "Inflatie is de algemene stijging van prijzen over tijd, waardoor de koopkracht van een vast geldbedrag afneemt.",
      steps: [
        "Vergelijk spaar- en beleggingsrendementen met inflatie, niet alleen in absolute termen.",
        "Geef voor langetermijndoelen de voorkeur aan bezittingen met historisch inflatie-verslaand potentieel.",
      ],
      risks: ["Cash dat jarenlang stilstaat kan reële waarde verliezen, ook al blijft het nominale bedrag gelijk."],
      considerations: ["Overtreft jouw verwachte beleggingsrendement de inflatie over jouw tijdshorizon?"],
    },
  },
  {
    key: "diversification",
    keywords: ["diversification", "diversify", "spreiding", "diversifiëren"],
    en: {
      title: "Diversification",
      explanation: "Diversification spreads investments across different assets so no single holding dominates your outcome.",
      steps: [
        "Spread across asset classes (stocks, bonds, cash, real assets).",
        "Spread within an asset class across sectors, regions, or issuers.",
        "Rebalance periodically as allocations drift.",
      ],
      risks: ["Diversification reduces but does not eliminate risk of loss."],
      considerations: ["What is your current concentration in any single holding or sector?"],
    },
    nl: {
      title: "Spreiding (diversificatie)",
      explanation: "Spreiding verdeelt beleggingen over verschillende bezittingen zodat geen enkele positie je resultaat domineert.",
      steps: [
        "Spreid over activaklassen (aandelen, obligaties, cash, tastbare activa).",
        "Spreid binnen een activaklasse over sectoren, regio's of uitgevers.",
        "Herbalanceer periodiek naarmate de verhoudingen verschuiven.",
      ],
      risks: ["Spreiding vermindert risico maar sluit verlies niet uit."],
      considerations: ["Hoe geconcentreerd is jouw portefeuille momenteel in één positie of sector?"],
    },
  },
  {
    key: "etfs",
    keywords: ["etf", "etfs", "exchange traded fund"],
    en: {
      title: "ETFs",
      explanation: "An ETF (exchange-traded fund) holds a basket of securities and trades on an exchange like a single stock.",
      steps: [
        "Check what index or strategy the ETF tracks.",
        "Compare the expense ratio against similar funds.",
        "Confirm the ETF fits your target diversification, not just its ticker's popularity.",
      ],
      risks: ["ETFs still carry the market risk of their underlying holdings."],
      considerations: ["Does this ETF overlap with holdings you already own?"],
    },
    nl: {
      title: "ETF's",
      explanation: "Een ETF (exchange-traded fund) bevat een mandje effecten en wordt verhandeld op een beurs, zoals een los aandeel.",
      steps: [
        "Controleer welke index of strategie de ETF volgt.",
        "Vergelijk de kostenratio met vergelijkbare fondsen.",
        "Zorg dat de ETF past bij je gewenste spreiding, niet alleen bij de populariteit van de ticker.",
      ],
      risks: ["ETF's dragen nog steeds het marktrisico van hun onderliggende posities."],
      considerations: ["Overlapt deze ETF met posities die je al bezit?"],
    },
  },
  {
    key: "bonds",
    keywords: ["bond", "bonds", "obligatie", "obligaties"],
    en: {
      title: "Bonds",
      explanation: "A bond is a loan you make to a government or company in exchange for periodic interest and repayment of principal at maturity.",
      steps: [
        "Check the issuer's credit quality and the bond's maturity date.",
        "Understand that bond prices move inversely to interest rates before maturity.",
        "Match bond maturities to when you'll actually need the money.",
      ],
      risks: ["Issuer default risk and interest-rate risk before maturity."],
      considerations: ["Do you plan to hold to maturity or might you need to sell early?"],
    },
    nl: {
      title: "Obligaties",
      explanation: "Een obligatie is een lening aan een overheid of bedrijf in ruil voor periodieke rente en terugbetaling van de hoofdsom op de vervaldatum.",
      steps: [
        "Controleer de kredietkwaliteit van de uitgever en de looptijd van de obligatie.",
        "Besef dat obligatiekoersen vóór de vervaldatum omgekeerd bewegen ten opzichte van de rente.",
        "Stem looptijden af op het moment waarop je het geld daadwerkelijk nodig hebt.",
      ],
      risks: ["Wanbetalingsrisico van de uitgever en renterisico vóór de vervaldatum."],
      considerations: ["Ben je van plan tot de vervaldatum aan te houden, of kan verkoop eerder nodig zijn?"],
    },
  },
  {
    key: "dividends",
    keywords: ["dividend", "dividends", "dividenden"],
    en: {
      title: "Dividends",
      explanation: "A dividend is a portion of a company's profit distributed to shareholders, usually on a regular schedule.",
      steps: [
        "Check the dividend yield alongside the payout ratio, not in isolation.",
        "Consider reinvesting dividends to compound returns over time.",
        "Remember dividends are not guaranteed and can be cut.",
      ],
      risks: ["A high yield can signal financial stress rather than strength."],
      considerations: ["Are you investing for income now, or growth plus reinvestment later?"],
    },
    nl: {
      title: "Dividenden",
      explanation: "Een dividend is een deel van de winst van een bedrijf dat wordt uitgekeerd aan aandeelhouders, meestal volgens een vast schema.",
      steps: [
        "Bekijk het dividendrendement samen met de pay-outratio, niet los daarvan.",
        "Overweeg dividenden te herinvesteren om rendement over tijd te laten samenstellen.",
        "Onthoud dat dividenden niet gegarandeerd zijn en verlaagd kunnen worden.",
      ],
      risks: ["Een hoog rendement kan wijzen op financiële stress in plaats van kracht."],
      considerations: ["Beleg je nu voor inkomen, of voor groei plus herinvestering later?"],
    },
  },
  {
    key: "riskManagement",
    keywords: ["risk management", "risicobeheer"],
    en: {
      title: "Risk Management",
      explanation: "Risk management is identifying financial risks and deliberately deciding how much of each you're willing to accept.",
      steps: [
        "Identify risks: market, credit, liquidity, concentration, income loss.",
        "Size positions so no single risk can cause irreversible damage.",
        "Use insurance and an emergency fund to cover risks you can't diversify away.",
      ],
      risks: ["No strategy removes risk entirely — only manages it."],
      considerations: ["Which single event would hurt your finances the most right now?"],
    },
    nl: {
      title: "Risicobeheer",
      explanation: "Risicobeheer betekent financiële risico's identificeren en bewust bepalen hoeveel van elk je bereid bent te accepteren.",
      steps: [
        "Identificeer risico's: markt, krediet, liquiditeit, concentratie, inkomstenverlies.",
        "Bepaal posities zo dat geen enkel risico onomkeerbare schade kan veroorzaken.",
        "Gebruik verzekeringen en een noodfonds voor risico's die je niet kunt wegspreiden.",
      ],
      risks: ["Geen enkele strategie verwijdert risico volledig — het wordt alleen beheerd."],
      considerations: ["Welke ene gebeurtenis zou jouw financiën nu het hardst raken?"],
    },
  },
  {
    key: "cashFlow",
    keywords: ["cash flow", "cashflow"],
    en: {
      title: "Cash Flow",
      explanation: "Cash flow is the net movement of money in and out of your finances over a period — income minus expenses and obligations.",
      steps: [
        "Track all inflows and outflows, including irregular ones.",
        "Aim for consistently positive cash flow before increasing discretionary spending.",
        "Use surplus cash flow deliberately — savings, debt payoff, or investing.",
      ],
      risks: ["Negative cash flow sustained over time leads to debt or depleted savings."],
      considerations: ["Is your negative-cash-flow period temporary or structural?"],
    },
    nl: {
      title: "Cashflow",
      explanation: "Cashflow is de netto beweging van geld in en uit je financiën over een periode — inkomen minus uitgaven en verplichtingen.",
      steps: [
        "Volg alle inkomende en uitgaande bedragen, ook onregelmatige.",
        "Streef naar consistent positieve cashflow voordat je discretionaire uitgaven verhoogt.",
        "Gebruik overtollige cashflow bewust — sparen, schulden aflossen of beleggen.",
      ],
      risks: ["Langdurig negatieve cashflow leidt tot schulden of uitgeputte spaargelden."],
      considerations: ["Is jouw periode van negatieve cashflow tijdelijk of structureel?"],
    },
  },
  {
    key: "netWorthTopic",
    keywords: ["net worth", "nettovermogen"],
    en: {
      title: "Net Worth",
      explanation: "Net worth is what you own (assets) minus what you owe (liabilities) at a point in time.",
      steps: [
        "List all assets at current market value.",
        "List all liabilities at current outstanding balance.",
        "Track net worth periodically rather than reacting to short-term swings.",
      ],
      risks: ["Illiquid assets can overstate how much money you can actually access quickly."],
      considerations: ["Is your net worth trend improving over the last 6-12 months?"],
    },
    nl: {
      title: "Nettovermogen",
      explanation: "Nettovermogen is wat je bezit (activa) minus wat je verschuldigd bent (schulden) op een bepaald moment.",
      steps: [
        "Noteer alle bezittingen tegen de huidige marktwaarde.",
        "Noteer alle schulden tegen het huidige openstaande saldo.",
        "Volg je nettovermogen periodiek in plaats van te reageren op kortetermijnschommelingen.",
      ],
      risks: ["Illiquide bezittingen kunnen overschatten hoeveel geld je snel echt kunt opnemen."],
      considerations: ["Verbetert jouw nettovermogen de afgelopen 6-12 maanden?"],
    },
  },
  {
    key: "financialDiscipline",
    keywords: ["financial discipline", "financiële discipline"],
    en: {
      title: "Financial Discipline",
      explanation: "Financial discipline is consistently following your plan (budget, savings, investing) even when it's tempting not to.",
      steps: [
        "Automate the decisions you want to stick to (savings, investing, bill payments).",
        "Review your plan on a fixed schedule rather than reacting emotionally to every event.",
        "Track progress visibly to reinforce the habit.",
      ],
      risks: ["Rigid discipline with no flexibility can also lead to burnout and abandoning the plan."],
      considerations: ["Which single habit, if automated, would most improve your consistency?"],
    },
    nl: {
      title: "Financiële discipline",
      explanation: "Financiële discipline betekent consequent je plan volgen (budget, sparen, beleggen), ook als het verleidelijk is dat niet te doen.",
      steps: [
        "Automatiseer de beslissingen waar je aan wilt vasthouden (sparen, beleggen, rekeningen betalen).",
        "Evalueer je plan op een vast schema in plaats van emotioneel op elke gebeurtenis te reageren.",
        "Houd voortgang zichtbaar bij om de gewoonte te versterken.",
      ],
      risks: ["Te rigide discipline zonder flexibiliteit kan ook tot burn-out leiden en het plan laten varen."],
      considerations: ["Welke ene gewoonte zou, indien geautomatiseerd, jouw consistentie het meest verbeteren?"],
    },
  },
]

function formatEducationTopic(topic, language) {
  const content = topic[language] || topic.en
  const stepsLabel = language === "nl" ? "Praktische stappen" : "Practical steps"
  const risksLabel = language === "nl" ? "Risico's" : "Risks"
  const considerLabel = language === "nl" ? "Vragen om te overwegen" : "Questions to consider"

  const lines = [
    content.title,
    "",
    content.explanation,
    "",
    `${stepsLabel}:`,
    ...content.steps.map((step) => `- ${step}`),
    "",
    `${risksLabel}:`,
    ...content.risks.map((risk) => `- ${risk}`),
    "",
    `${considerLabel}:`,
    ...content.considerations.map((item) => `- ${item}`),
  ]

  return lines.join("\n")
}

export function answerEducationalQuestion(question, language) {
  const lower = question.toLowerCase()
  const topic = EDUCATION_TOPICS.find((item) => item.keywords.some((keyword) => lower.includes(keyword)))
  if (!topic) return null

  return {
    text: formatEducationTopic(topic, language),
    disclaimer: EDUCATION_DISCLAIMER[language] || EDUCATION_DISCLAIMER.en,
  }
}

// Main entry point used by useMoneyAI / aiService's local fallback.
export function answerQuestion({ question, language, financialContext }) {
  const resolvedLanguage = language === "nl" ? "nl" : "en"
  const trimmed = (question || "").trim()

  if (!trimmed) {
    return { text: L[resolvedLanguage].unsupported, disclaimer: null }
  }

  try {
    const platformAnswer = answerPlatformQuestion(trimmed, resolvedLanguage, financialContext)
    if (platformAnswer) {
      return { text: platformAnswer, disclaimer: null }
    }
  } catch {
    return {
      text:
        resolvedLanguage === "nl"
          ? "Ik kon deze vraag niet verwerken met je huidige gegevens. Controleer of je transactiedata compleet is."
          : "I couldn't process that question against your current data. Check that your transaction records are complete.",
      disclaimer: null,
    }
  }

  const educational = answerEducationalQuestion(trimmed, resolvedLanguage)
  if (educational) return educational

  return { text: L[resolvedLanguage].unsupported, disclaimer: null }
}
