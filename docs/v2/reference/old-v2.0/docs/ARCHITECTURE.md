# Money Mind 2.0 Architecture

## Product architecture

Money Mind is separated into marketing, authentication, authenticated application, financial domain, AI, and optional 3D experience areas. App Router route groups organize public and future protected screens without changing their public URLs.

```text
Financial domain
  -> services and repositories
  -> application logic
  -> React UI
  -> motion
  -> optional 3D experiences
```

Presentation code must not become the source of truth for financial calculations or authorization.

## Rendering architecture

- Server Components are the default for routes and static composition.
- Client Components are limited to browser APIs, interactive state, and event handlers.
- Motion components enhance state changes and must respect reduced-motion preferences.
- WebGL components are dynamically isolated and never required for core navigation.
- Authenticated routes share `app/(app)/layout.tsx`; its server layout mounts a focused interactive shell boundary while route content remains server-renderable.
- Desktop and mobile navigation consume one typed configuration in `config/navigation.ts`. Shell-only state remains local and does not enter financial domain state.

## Financial architecture

Financial calculations belong in domain and service modules, not React presentation components. Persisted records are scoped by `userId`. Monetary values use integer minor units where the currency supports them. Derived dashboard totals are not source-of-truth balances unless an auditable snapshot is explicitly designed.

Future domain concepts include users, accounts, transactions, categories, budgets, bills, goals, debts, assets, liabilities, investments, recurring transactions, financial health, and AI insights. Canonical schemas will be introduced with the data layer rather than speculated in Layer 0.

## 3D architecture

The `three/` directory owns WebGL scenes, React Three Fiber components, custom materials, shaders, and 3D utilities. Three-dimensional views are optional enhancements for the landing experience, Money Universe, wealth, investments, and relationship visualization. They are never a navigation or accessibility dependency.

## Backend architecture

- Firebase Authentication establishes identity.
- Firestore persists user-scoped financial records.
- Firebase Storage is used only for file assets that require it.
- Firebase Functions or server-side services own privileged workflows and validation.

The Firebase web client is initialized once in `lib/firebase/client.ts`. Public client configuration comes from validated environment variables in `lib/firebase/config.ts`. Admin credentials are intentionally absent until a server-only use case is implemented.

Layer 3 adds a client session provider backed by Firebase's auth-state observer. Typed authentication and user-profile services isolate Firebase calls from screens. A shared verified-email guard protects the application route group without rebuilding the Layer 2 shell. Server-validated HTTP-only session cookies remain a documented future hardening step.

Layer 4 adds one session-scoped profile provider above routing guards. Dashboard access waits for a verified identity and completed profile; onboarding owns resumable preference and intent collection without writing canonical financial-domain documents.

Layer 5 establishes the canonical React-independent financial types, deterministic money/date/rate primitives, runtime validation, persistence mappers, and user-scoped repository contracts. See `docs/FINANCIAL_DOMAIN.md`. The intended data flow is UI → application/domain service → repository → Firestore; ownership comes from authenticated context and Firebase timestamps remain behind mapping boundaries.

## Security model

The client is not trusted. Authorization must be enforced by Firebase Security Rules and server-side validation. UI visibility is not authorization. AI services cannot directly mutate balances or ledger entries. Secrets must never use `NEXT_PUBLIC_` variables or enter the client bundle.
