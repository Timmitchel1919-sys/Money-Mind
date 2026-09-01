# Money Mind V2 foundation

Money Mind V2 is an evolutionary upgrade of the working V1 application. V1 remains the functional baseline while V2 capabilities are introduced behind centralized feature flags.

## Architectural boundaries

- `src/app`: application composition and configuration
- `src/core`: cross-cutting infrastructure such as feature flags, auth, data, and security
- `src/financial`: financial domain models and services (introduced incrementally; existing V1 logic remains in place)
- `src/visualization`: renderer-neutral adapters and visualization models
- `src/spatial`: spatial contracts and future rendering implementation
- `src/motion`: motion policy, tokens, and future orchestration
- `src/ai`: future V2 intelligence boundary; existing Money AI remains unchanged
- `src/shared`: reusable domain-independent code introduced as needed
- `src/styles`: V2 tokens and foundations

The chapter registry is the source of traceability between requirements, implementation, and validation. Chapters are not code organization units.

## Foundation rules

1. Financial calculations do not live in rendering components.
2. Renderers consume normalized models through adapters and never query Firestore directly.
3. Critical financial information always has a non-spatial path.
4. V2 flags default off and child flags require `VITE_V2_ENABLED=true`.
5. New dependencies are added only by the layer that immediately uses them.
