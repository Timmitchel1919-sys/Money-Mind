# MONEY MIND V2 RELEASE BLOCKED — PRODUCTION DEPLOYMENT NOT AUTHORIZED

The audited source candidate is `ca2c58d` on
`codex/ux-remediation-2026-11-05`. The audit's documentation may be committed
after that source commit; no later source candidate is implied.

The V2 app shell is enabled by the tracked production profile. The unfinished
Spline child flag is unset and defaults off. The clean-source archive build,
its PWA artifact check, financial and spatial contract checks passed as
described in [the readiness audit](release-readiness-audit.md). This is not
full integration, security or release acceptance.

Blocking items: validate the undeployed `moneyAIUsage` rules WIP and callable
concurrency in isolation; recover the Firebase CLI and run the demo-project Auth and
Firestore authorization suite; validate authenticated financial workspaces;
resolve currency provenance in intelligence paths; verify PWA installation,
updates and offline financial behavior; complete dependency/security review;
and repair and verify native Spline events and labels before enabling Spline.
Local unrelated media deletions must not enter a release artifact.

## Deployment and rollback plan — not executed

After all release gates pass and the user explicitly approves production,
build from the reviewed committed source and deploy Hosting only to verified
project/site `money-mind-90176` using `firebase deploy --only hosting --project
money-mind-90176`. Verify both configured Hosting domains, authentication,
navigation, service-worker behavior and critical errors. Record the deployed
commit and release. If rollback is necessary, use the Firebase Hosting release
history to restore the previously verified Hosting release and repeat smoke
checks; do not touch Firestore or Functions as part of a Hosting rollback.
The CLI currently fails to start in this environment, so this plan is not
validated as executable here. No production approval or deployment occurred.
