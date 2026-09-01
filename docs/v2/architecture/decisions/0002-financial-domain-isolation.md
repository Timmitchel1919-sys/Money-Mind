# ADR 0002: Financial domain isolation

- Status: Accepted
- Date: 2026-08-21

## Decision

Financial rules and calculations remain independent of UI, visualization, motion, and rendering. Application services expose normalized financial models to adapters.

## Consequences

Visual components cannot become the source of financial truth. Existing V1 logic will move only when a feature requires a safe boundary.
