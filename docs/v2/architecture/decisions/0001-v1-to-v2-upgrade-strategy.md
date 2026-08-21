# ADR 0001: V1 to V2 upgrade strategy

- Status: Accepted
- Date: 2026-08-21

## Decision

Build V2 as an evolutionary, feature-flagged upgrade on the validated V1 application. Preserve working behavior and migrate it incrementally rather than rebuilding the product.

## Consequences

V1 remains usable while V2 layers are developed. Refactors require a specific V2 need and regression validation.
