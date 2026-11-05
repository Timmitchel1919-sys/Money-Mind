# Money AI rate-limit security remediation plan

Status: **WIP — emulator validation and production deployment are not authorized or complete.**

## Boundary and finding

The repository's version 2 `firestore.rules` grants an authenticated owner
read/write access recursively under `users/{uid}`. That grant includes
`users/{uid}/moneyAIUsage/{functionName}`. `functions/index.js` uses that path
as its rate-limit authority. A client that owns the UID appears able to modify
or delete its own counters. This is a source-level finding; neither deployed
rules nor exploitation against an emulator or production have been verified.

Firestore allow rules are additive. A narrower deny alone cannot override the
recursive allow. The proposed WIP changes the owner grant to cover the user
document and non-usage child collections while excluding `moneyAIUsage` and all
its descendants. Server Admin SDK access bypasses Firestore Security Rules.
No client references to `moneyAIUsage` were found in the repository. Existing
counter paths and financial document schemas are unchanged.

## Function behavior and compatibility

`agentQuery` and `moneyAIVoiceSynthesize` derive UID from callable authentication,
use fixed server-selected counter names and limits (10 and 15 per 60 seconds),
and call the limiter before provider operations. The counter check and update
occur in a Firestore transaction. Missing or expired counters start a new window;
attempts are charged before downstream validation/provider calls, including
failures after the transaction. Atomic concurrency and retry behavior require
emulator tests; source inspection alone does not verify them.

## Test and deployment gates

Use only `demo-money-mind-e2e` with Auth at `127.0.0.1:9099` and Firestore at
`127.0.0.1:8080`. The dedicated test must refuse to run unless all explicit
emulator settings match; never use production credentials or financial records.
Test own financial writes, cross-user and unauthenticated denial, and client
create/read/update/delete of seeded counters including nested descendants.
Verify Admin SDK counter access, transaction concurrency, time boundaries and
legitimate callable behavior separately. The local Firebase CLI has previously
hung before startup; emulator runtime verification may remain blocked.

Do not deploy rules, Functions or Hosting. A rules change is not security
acceptance until both emulator authorization and legitimate-workflow regression
tests pass and a separate production approval is obtained.
