# Reference archive — old "Money Mind V2.0-3D"

Snapshot of the standalone `Money-Mind-V2.0-3D` GitHub repo, archived here on
2026-09-01 so the GitHub repo can be safely deleted without losing anything.

- `old-v2.0/` — full extracted source (150 files).
- `old-v2.0-source.zip` — pristine original ZIP (as uploaded).

## What it is (and is NOT)

A **greenfield Next.js 16 + TypeScript 6 rebuild** — foundation only:
design system, app shell, Firebase auth, onboarding, and a typed financial
domain. It has **no 3D** (`three/` is an empty README-only boundary) and
**no working features** (every dashboard page is a `ModulePlaceholder`).

The live app on `develop/v2` is ahead on 3D, features, Money AI and backend.
This archive is kept only to **harvest** assets/specs from it:
design tokens (`styles/`), the minor-unit money domain (`domain/finance/`),
typed schemas (`types/finance/`), auth/onboarding UX, and the test approach.

See the full comparison in `../migration/v2-migration-gap-report.md`
(Deel B = gap-matrix, Deel C = harvest order).
