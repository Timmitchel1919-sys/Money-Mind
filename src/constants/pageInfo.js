// Content shown by the "+" info button in the Topbar. Keyed by the same
// `activePage` values used in App.jsx / Sidebar.jsx, so every page in the
// main nav (plus Settings) has a matching entry here.
const pageInfo = {
  dashboard: {
    title: "Dashboard",
    purpose:
      "Your financial home screen — a single glance at income, expenses, cash flow, and overall health.",
    whatHappens: [
      "Pulls together totals from Budget, Transactions, Debt, Emergency Fund, and KPIs into one summary.",
      "Shows your Financial Health Score, Debt-to-Income Ratio, and Emergency Fund Coverage.",
      "Surfaces a Quick Insight so you know what to look at first.",
    ],
    howItWorks: [
      "Every number here is calculated live from the data you enter on the other pages — nothing is typed in directly on the Dashboard.",
      "Add or edit a transaction, budget, or debt elsewhere and the Dashboard updates automatically.",
    ],
  },

  budget: {
    title: "Budget",
    purpose: "Plan your monthly income against spending categories and see what's left to spend.",
    whatHappens: [
      "You set a monthly income and create budget categories with an amount and currency.",
      "Each category can be edited or deleted, and remaining budget is tracked automatically.",
    ],
    howItWorks: [
      "Remaining budget = income minus the total of all category amounts, converted into your base currency.",
      "These categories feed the Dashboard, Charts, and Reports pages.",
    ],
  },

  transactions: {
    title: "Transactions",
    purpose: "Log individual income and expense transactions to track exactly where your money goes.",
    whatHappens: [
      "Add a transaction with an amount, type (income/expense), category, and currency.",
      "Recent Transactions lists everything you've logged, with running Income, Expenses, and Cash Flow totals.",
    ],
    howItWorks: [
      "Every transaction is converted to your base currency using live exchange rates, then totalled.",
      "This is the raw data behind your Cash Flow, Reports, and Dashboard numbers.",
    ],
  },

  bills: {
    title: "Bills",
    purpose: "Keep track of recurring bills and subscriptions so nothing gets missed.",
    whatHappens: [
      "Add a bill or subscription with an amount, currency, and due date.",
      "Active Bills, Upcoming Bills, and the Next Due date are shown automatically.",
    ],
    howItWorks: [
      "Bills are sorted by due date so the most urgent one always surfaces first.",
      "This data also powers the Financial Calendar and Cash Flow Forecast pages.",
    ],
  },

  calendar: {
    title: "Financial Calendar",
    purpose: "See all your upcoming bills laid out on a calendar instead of a list.",
    whatHappens: [
      "Displays every bill you've added on the day it's due, plus Next Payment and Total Due for the period.",
    ],
    howItWorks: [
      "It reads directly from the bills you created on the Bills page — there's nothing to add here.",
    ],
  },

  cashflowforecast: {
    title: "Cash Flow Forecast",
    purpose: "Project your future cash position based on expected income, expenses, and bills.",
    whatHappens: [
      "Combines your recurring Bills with typical Income and Expenses to forecast upcoming cash flow.",
    ],
    howItWorks: [
      "Projected Income minus Projected Expenses (including Bills) gives the Projected Cash Flow trend shown on the chart.",
    ],
  },

  networth: {
    title: "Net Worth",
    purpose: "Track everything you own against everything you owe to see your true net worth.",
    whatHappens: [
      "Add Assets (savings, investments, property, etc.) and Liabilities (loans, debt, etc.).",
      "Total Assets and Total Liabilities are summed and compared.",
    ],
    howItWorks: ["Net Worth = Total Assets minus Total Liabilities, converted to your base currency."],
  },

  goals: {
    title: "Goals",
    purpose: "Set savings goals and track your progress toward each one.",
    whatHappens: [
      "Add a financial goal with a target amount and track how much you've saved toward it.",
      "Overall Progress, Total Goal Target, and Total Saved summarize all goals together.",
    ],
    howItWorks: ["Each goal's progress bar = amount saved divided by its target amount."],
  },

  emergency: {
    title: "Emergency Fund",
    purpose: "Check whether your emergency savings can cover enough months of expenses.",
    whatHappens: [
      "Enter your monthly expenses and current emergency savings.",
      "The calculator shows Months Covered and an overall Emergency Fund Status.",
    ],
    howItWorks: ["Months Covered = Emergency Savings divided by Monthly Expenses."],
  },

  debt: {
    title: "Debt Manager",
    purpose: "Track every debt account in one place and see your total debt load.",
    whatHappens: [
      "Add a debt account with a balance and monthly payment.",
      "Total Debt and Total Monthly Payments across all accounts are calculated for you.",
    ],
    howItWorks: ["This feeds your Debt-to-Income Ratio on the Dashboard and Financial KPIs pages."],
  },

  savings: {
    title: "Savings Planner",
    purpose: "Plan dedicated savings pots and track how close you are to each target.",
    whatHappens: [
      "Add a savings plan with a target amount and a monthly saving amount.",
      "Currently Saved, Total Target, and per-plan Progress are tracked automatically.",
    ],
    howItWorks: ["Progress = amount currently saved divided by the plan's total target."],
  },

  currency: {
    title: "Currency Center",
    purpose: "Convert between currencies and check the freshness of exchange rates used across the app.",
    whatHappens: [
      "Use the Currency Converter to convert an amount between any two supported currencies.",
      "Live Rate Status shows when exchange rates were last updated.",
    ],
    howItWorks: ["The same exchange rates shown here are used everywhere else in the app to convert amounts to your base currency."],
  },

  investments: {
    title: "Investment Tracker",
    purpose: "Track individual investments and see their return over time.",
    whatHappens: [
      "Add an investment with the amount invested and its current value.",
      "Total Invested, Current Value, Profit/Loss, and Return are calculated per investment and in total.",
    ],
    howItWorks: ["Profit/Loss = Current Value minus Total Invested. Return is that difference expressed as a percentage."],
  },

  portfolio: {
    title: "Portfolio Dashboard",
    purpose: "See your whole investment portfolio — holdings, allocation, performance, and a dividend estimate — in one view.",
    whatHappens: [
      "Aggregates every entry from Investment Tracker into Portfolio Holdings, Asset Allocation, and a Portfolio Performance Trend.",
      "Lets you set an assumed average dividend yield to estimate the Annual and Monthly Dividend income your current portfolio value could generate.",
    ],
    howItWorks: [
      "Holdings and allocation come straight from Investment Tracker — this page doesn't collect new investment data, only visualizes it.",
      "The dividend estimate is a simple portfolio value x assumed yield% calculation, separate from Dividend Tracker and Dividend Dashboard.",
      "The Performance Trend chart is an illustrative ramp toward your current cost and value, not an actual historical record.",
    ],
  },

  dividends: {
    title: "Dividend Tracker",
    purpose: "Run a quick dividend income projection for a single asset.",
    whatHappens: [
      "Enter an asset name, number of shares/units, dividend paid per share, and how often it's paid.",
      "See the resulting estimated Annual Dividend income for that one scenario.",
    ],
    howItWorks: [
      "Annual Dividend = shares x dividend-per-share x payments per year (monthly = 12, quarterly = 4, semiannual = 2, annual = 1).",
      "This is a standalone calculator — it doesn't keep a saved list and isn't linked to Investment Tracker or Portfolio Dashboard.",
    ],
  },

  dividendDashboard: {
    title: "Dividend Dashboard",
    purpose: "Check how close a dividend portfolio is to covering a target monthly income.",
    whatHappens: [
      "Enter a portfolio value, an assumed average dividend yield, and a target monthly dividend income.",
      "See the resulting Annual and Monthly Dividend income, and your Dividend Independence Progress toward that target.",
    ],
    howItWorks: [
      "Annual Dividend = Portfolio Value x yield%. Progress = monthly dividend divided by your target monthly income.",
      "This is a self-contained scenario calculator — the portfolio value here is typed in manually, not pulled from Investment Tracker or Portfolio Dashboard.",
    ],
  },

  retirement: {
    title: "Retirement Planner",
    purpose: "Estimate how much your retirement savings will grow to by your target retirement age.",
    whatHappens: [
      "Enter your monthly contribution, expected return, and years left until retirement.",
      "See a Retirement Projection showing your estimated Projected Value.",
    ],
    howItWorks: ["Projects monthly contributions compounded at the expected annual return over the years remaining."],
  },

  inflation: {
    title: "Inflation Calculator",
    purpose: "See how inflation erodes the purchasing power of an amount of money over time.",
    whatHappens: [
      "Enter a current amount, an inflation rate, and a number of years.",
      "See the equivalent Future Cost and the resulting Purchasing Power Impact.",
    ],
    howItWorks: ["Future Cost = Current Amount x (1 + inflation rate) raised to the power of the number of years."],
  },

  loanpayoff: {
    title: "Loan Payoff Calculator",
    purpose: "Work out how long it will take to pay off a loan and how much interest you'll pay in total.",
    whatHappens: [
      "Enter the loan balance, interest rate, and monthly payment.",
      "See Months Left and Total Interest in a Payoff Projection.",
    ],
    howItWorks: ["Simulates the balance paying down month by month, applying interest each period until it reaches zero."],
  },

  reports: {
    title: "Reports",
    purpose: "Get a summarized report of your financial performance over a period.",
    whatHappens: [
      "Shows Total Income, Total Expenses, Savings Rate, and Budget Usage for the period.",
      "Ends with a Money Mind Insight highlighting what stands out.",
    ],
    howItWorks: ["Built entirely from your existing Transactions and Budget data — nothing new to enter here."],
  },

  charts: {
    title: "Charts",
    purpose: "Visualize your finances — income, expenses, budget, savings, and net worth — as charts.",
    whatHappens: [
      "Income vs Expenses, Budget Allocation, Savings Progress, and Net Worth Breakdown are all plotted visually.",
    ],
    howItWorks: ["Pulls the same underlying numbers as Transactions, Budget, Savings Planner, and Net Worth, just rendered as charts instead of lists."],
  },

  health: {
    title: "Financial Health",
    purpose: "Get an overall Health Score that summarizes how sound your finances are right now.",
    whatHappens: [
      "Shows a Health Score, Savings Rate, and Emergency Cover, along with a Status label and Financial Health Analysis.",
    ],
    howItWorks: ["Combines savings rate, emergency fund coverage, and debt levels into one weighted score."],
  },

  kpis: {
    title: "Financial KPIs",
    purpose: "Track the key performance indicators that matter most for your financial position, measured against targets you set.",
    whatHappens: [
      "Shows Financial Health Score, Savings Rate, Cash Flow Margin, Emergency Fund Coverage, Debt-to-Income, Net Worth, and Budget Adherence as cards with a target and gap.",
      "Lets you edit and save your own KPI targets, filter income/expense figures by period, export a KPI summary, and see an Insights list flagging what needs attention.",
    ],
    howItWorks: [
      "Every KPI is calculated live from your Transactions, Budget, Debt, Investments, Goals, and Savings Plans data — targets are the only thing you set on this page.",
      "Balances like Net Worth, Debt, and Investments always reflect current values; only income/expense-based figures respect the Period filter.",
    ],
  },

  export: {
    title: "Export Center",
    purpose: "Export your Money Mind data so you can back it up or use it outside the app.",
    whatHappens: [
      "Pick a dataset (Transactions, Budgets, Assets, Liabilities, Goals, Debts, Savings Plans, Investments, Bills) and export it, or export everything at once.",
    ],
    howItWorks: ["Each export runs entirely in your browser and downloads a CSV file built from your current data — nothing is uploaded or sent to a server."],
  },

  settings: {
    title: "Settings",
    purpose: "Manage your account, preferences, and app behavior.",
    whatHappens: [
      "Update your Profile, Financial Persona, and Financial Preferences (currency, number format, etc.).",
      "Configure App Lock, Notification Preferences, Theme, and Money AI Voice.",
    ],
    howItWorks: ["Changes here apply immediately across the whole app — for example, switching base currency updates every other page's totals."],
  },
}

export default pageInfo
