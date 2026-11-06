# Money Mind 2.0 Financial Domain

Layer 5 is the canonical, React-independent financial contract. UI calls application services; services obtain ownership from authenticated context; repositories validate and map domain objects; Firestore persists user-scoped documents. Components must not call `setDoc()` directly.

## Relationship model

```text
User
├── Accounts
│   ├── Transactions (logical transfers link two entries)
│   └── Investment Holdings
├── Categories
├── Budgets
│   └── Budget Items
├── Bills
├── Goals
│   └── Goal Contributions
├── Debts
│   └── Debt Payments
├── Assets
├── Recurring Transactions
├── Financial Health Snapshots
└── AI Insights
```

## Money representation

`Money` is `{ amountMinor: number; currency: CurrencyCode }`. Canonical amounts are safe integer minor units, never decimal floats. `Number.isSafeInteger` is enforced for stored values and arithmetic results. If product requirements exceed JavaScript safe integers, a versioned migration to decimal strings or an arbitrary-precision backend representation is required; unsafe numbers must never be silently stored.

Currency codes are trimmed, uppercased, required to have three letters, and verified through `Intl.NumberFormat`. Fraction precision comes from platform ISO currency metadata: for example JPY has 0, USD 2, and BHD 3 digits. Unsupported codes and unsupported precision fail explicitly.

`parseMoneyInput` accepts surrounding whitespace, optional `+`/`-`, digits, and an optional `.` fraction. It rejects empty input, grouping commas, scientific notation, malformed decimals, and excess fractional digits. It operates on strings, not `parseFloat`. Signed `Money` supports intermediate arithmetic, but entity validators impose their own sign rules.

Arithmetic requires equal currencies and checks safe-integer overflow. Formatting uses `Intl.NumberFormat` and never changes storage or performs FX conversion.

## Rates

Rates use safe-integer basis points: 5.25% is `525`. Entity validators prohibit negative rates unless a future explicit use case allows them. Decimal percentages are not canonical storage.

## Dates and timestamps

Business dates use validated `YYYY-MM-DD` strings so timezone conversion cannot change transaction, due, target, valuation, or payment dates. Validation checks the actual Gregorian calendar, not only a regex. Audit events use domain `Date` values: `createdAt`, `updatedAt`, `archivedAt`, `voidedAt`, `closedAt`, and `calculatedAt`. Mappers translate between domain dates and persistence timestamps; Firebase `Timestamp` is not a domain type.

## Accounts

Types are checking, savings, cash, credit-card, loan, investment, retirement, property, business, and other. Status is active, archived, or closed. Optional credit limit, interest rate, institution, last four digits, and notes are not imposed on irrelevant types. Complete bank-account numbers are forbidden.

Canonical balance truth is opening balance plus posted, non-voided ledger activity. A future cached balance must be reconcilable; mutable `currentBalance` is not the sole source of truth. Accounts are archived or closed rather than destructively deleted.

An Account is ledger-bearing. An Asset is manually valued non-account property. Cash belongs in an Account, and the same object should not appear in both collections without a documented reconciliation reason. Investment and retirement accounts remain Accounts; holdings reference them.

## Transactions and transfers

Income, expense, and transfer amounts use positive magnitude. Type and context supply direction. Status is pending, posted, or voided; voided entries are excluded from active ledger calculations but remain auditable.

A logical transfer is represented by two entries sharing an opaque `transferId`: a source `transfer-out` and destination `transfer-in`. It is neither income nor expense. Source and destination are required and distinct, and principal is positive. Same-currency entries carry equal principal; fees are separate activity.

Cross-currency transfers require explicit source and destination amounts/currencies plus rational exchange-rate metadata. Layer 5 does not calculate FX. A single ambiguous amount is prohibited.

## Categories

Categories are income or expense, optionally have one parent, and distinguish system records through `isSystem`. Stable IDs such as `housing`, `food`, `salary`, and `business-income` are not localized labels. System IDs are immutable to ordinary users. Categories archive rather than disappear from history.

## Budgets and bills

Budgets use monthly, weekly, or custom periods with explicit start/end business dates and currency. Budget items retain category and planned minor-unit amount. No calculation engine exists yet.

Bills use stable weekly, biweekly, monthly, quarterly, yearly, or custom recurrence identifiers, a due business date, amount/currency, optional account/category, autopay intent, and active/inactive/archived status. Layer 5 schedules nothing.

## Goals, contributions, debts, and payments

Goals preserve typed purpose, positive target, currency, optional target date, priority, status, and linked accounts. Progress derives from auditable `GoalContribution` records rather than one overwriteable value. Goals complete or archive.

Debt is the canonical ordinary-liability model; no redundant Liability entity exists. A Debt retains non-negative balance, optional original balance, basis-point rate, minimum payment, due day, term, and linked account. It closes rather than deletes. Debt payments preserve amount, principal, interest, date, and transaction link; principal plus interest cannot exceed payment, leaving room for later fee accounting. Amortization is deferred.

## Assets and investments

Assets represent manually valued property, vehicles, businesses, collectibles, or other non-account property, with valuation date and net-worth inclusion. Investment holdings reference an investment/retirement Account. Fractional quantity is a validated non-negative plain decimal string such as `12.345678`; JS floats are not canonical quantity storage. Prices are persistence fields only—no market-data fetching occurs.

## Recurring transactions, health, and insights

RecurringTransaction is a future template with stable frequency, dates, status, account/category, and magnitude; it does not generate transactions here. FinancialHealthSnapshot is versioned and stores component scores plus `calculatedAt`, but Layer 17 owns formulas. AIInsight is structured future persistence with type, summary, related IDs, status, generated time, and model version; no AI provider is connected and prose is not canonical financial state.

## Derived financial state

Net worth derives from included accounts plus included assets minus debts. Cash flow derives from qualifying income and expense transactions for a period; transfers are excluded. Neither total is a mutable canonical user-profile field. Historical totals will use timestamped/versioned snapshots instead of overwriting prior state.

## Ownership and Firestore paths

The authenticated Firebase UID is canonical ownership and structurally scopes every private collection. Domain records also carry `userId` for validation/audit, but forms never provide it. Repositories construct paths only from trusted auth context. Layer 6 will enforce the same boundary in rules.

```text
users/{uid}/accounts/{accountId}
users/{uid}/transactions/{transactionId}
users/{uid}/categories/{categoryId}
users/{uid}/budgets/{budgetId}
users/{uid}/bills/{billId}
users/{uid}/goals/{goalId}
users/{uid}/goalContributions/{contributionId}
users/{uid}/debts/{debtId}
users/{uid}/debtPayments/{paymentId}
users/{uid}/assets/{assetId}
users/{uid}/holdings/{holdingId}
users/{uid}/recurringTransactions/{recurringId}
users/{uid}/financialHealthSnapshots/{snapshotId}
users/{uid}/aiInsights/{insightId}
```

Budget items are embedded under their budget initially because they have budget-local identity and lifecycle. If query requirements later demand a subcollection, that is a versioned migration rather than an ad hoc alternate path.

## Validation and persistence mapping

Runtime validators are centralized in `domain/finance`; no external validation dependency is required. Persisted entity types are distinct from create/update inputs, and update inputs omit immutable `id`, `userId`, and audit creation fields. Focused account/transaction mappers validate unknown document data and convert timestamp-like values at the repository boundary. They do not expose snapshots or perform unsafe persistence spreads from form data.

## Historical integrity and lifecycle

Account/category name changes do not rewrite historical transactions. Transactions void rather than silently vanish. Contributions and debt payments remain auditable. Market values and future net-worth history are temporal snapshots. Accounts archive/close, categories archive, goals complete/archive, debts close, bills deactivate/archive, and transactions void. There is no indiscriminate universal deletion field.
