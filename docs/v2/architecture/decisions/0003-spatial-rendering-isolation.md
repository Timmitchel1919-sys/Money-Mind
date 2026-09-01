# ADR 0003: Spatial rendering isolation

- Status: Accepted
- Date: 2026-08-21

## Decision

Spatial renderers consume renderer-neutral scenes produced from normalized application models. They do not query Firebase and their objects are not persistence models.

## Consequences

Rendering technology can evolve without changing financial storage or rules.
