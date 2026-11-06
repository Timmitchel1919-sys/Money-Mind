# Spline canvas validation — 2026-11-06

The updated React export was loaded in the V2 app against Auth and Firestore
emulators using the isolated `demo-money-mind-e2e` project and a synthetic user.
The emulator used Java 21 with process-local
`-Djdk.net.unixdomain.tmpdir=money-mind-nonexistent-unix-socket-dir`: this
allowed Java NIO to fall back to TCP when Unix-domain socket setup failed.

On desktop, physical canvas clicks near each module's right edge produced:

| Module | Resulting route |
| --- | --- |
| Dashboard | `#v2/dashboard` |
| Money Movement | `#v2/money-movement` |
| Wealth Building | `#v2/wealth-building` |
| Intelligence | `#v2/intelligence` |
| Settings | `#v2/settings` |

In Chromium mobile emulation (390 × 844, touch enabled), tapping the right
edge of each module produced the same five routes. This verifies selection and
module-level routing, not entry into individual financial workspaces.

Clicks near the center of the modules did not select them. The overlapping
native text boxes are a suspected cause and require confirmation in Spline.
Mobile labels appeared very small. Accordingly the scene is not accepted as
fully usable, and the Spline feature flag remains disabled by default.
