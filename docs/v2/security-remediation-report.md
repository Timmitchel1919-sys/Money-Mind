# MONEY MIND V2 — SECURITY REMEDIATION INCOMPLETE

## Finding and WIP

Classification: **BLOCKED — static finding, not dynamically reproduced.** The
previous repository rule granted an authenticated owner recursive access below
`users/{uid}`, including the `moneyAIUsage` counters used by Cloud Functions.
The WIP rules now grant access to the user document and to other child
collections, excluding `moneyAIUsage` and its descendants from every matching
owner allow. No client reads or writes of that counter path were found in the
repository. Admin SDK writes are governed by IAM, not these client rules.

The Functions are unchanged. Authenticated UID and fixed function identifiers
are used for transaction-based counters before provider work; 60-second limits
are 10 agent and 15 voice requests. Failures after the counter transaction are
charged. Atomicity, contention, reset boundaries and legitimate callable
behavior have **not** been exercised. Existing potentially tampered counters are
not reset or migrated by this WIP.

## Evidence and limits

- Rules and overlapping matches were inspected statically. Firebase Rules
  permits access when any matching allow succeeds; see
  https://firebase.google.com/docs/rules/rules-behavior.
- `node --check functions/tests/rate-limit-rules-emulator.cjs`: pass.
- Running that test without explicit demo/emulator environment: rejected as
  intended. This tests its guard, not Firestore Rules.
- The prepared test uses synthetic Auth users and Admin SDK seeded documents;
  it covers own financial access, cross-user and unauthenticated denial,
  protected counter operations, unexpected counter names and nested paths.
  It has **not run against emulators**.
- Firebase CLI `13.35.1` produced no output in bounded Node 24 and Node 22
  `--version` attempts, including isolated config and disabled update check.
  The underlying CLI startup failure is unknown. A direct launch of the cached
  Firestore emulator with the demo project and local rules exited before
  serving requests: Java/Netty could not create its child event loop because a
  local Unix-domain socket connection returned `Invalid argument: connect`.
  This environment therefore did not compile or exercise the WIP rules. No
  production data was accessed.
- Financial domain and projection parity tests passed; V2 303 and spatial 238
  assertions passed; lint exited 0 with existing warnings; the production build
  completed and generated its service worker. These do not test
  rules, concurrency, cross-user access or financial-schema compatibility.

## Scoped security assessment

```json
{
  "score": 2,
  "summary": "The repository's prior owner grant appears to expose server-side rate-limit counters. The WIP exclusion is not emulator-verified or deployed.",
  "findings": [
    {"check": "Server-owned authority", "severity": "major", "issue": "The previous recursive owner allow covered Money AI usage counters.", "recommendation": "Verify the WIP exclusion and all overlapping matches in emulators before separate deployment approval."},
    {"check": "Financial document validation", "severity": "minor", "issue": "Owner-writable financial records remain without collection-specific type and size validation.", "recommendation": "Inventory legacy schemas and validate backward-compatible rules with emulator tests."}
  ]
}
```

## Reproduction in an isolated host environment

From the repository root, start Auth and Firestore emulators with the repository
rules using `firebase emulators:start --project demo-money-mind-e2e --only
auth,firestore`. In a separate PowerShell session, set `GCLOUD_PROJECT` to
`demo-money-mind-e2e`, `FIRESTORE_EMULATOR_HOST` to `127.0.0.1:8080`, and
`FIREBASE_AUTH_EMULATOR_HOST` to `127.0.0.1:9099`; then run
`node functions/tests/rate-limit-rules-emulator.cjs`. Confirm the emulator
actually loaded the repository rules; an emulator running open rules is not
valid evidence. Run the existing phase 1G/1H synthetic-user acceptance suite
and add real callable concurrency/window tests before security acceptance.

The WIP does not validate all financial schemas or migrate legacy records.
No rules, Functions or Hosting were deployed. Production release remains
blocked and any future production action requires explicit approval.
