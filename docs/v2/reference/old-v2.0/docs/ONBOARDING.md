# Money Mind 2.0 Onboarding

Layer 4 adds the deterministic sequence: unauthenticated users go to login, unverified users go to email verification, verified users with incomplete profiles go to `/onboarding`, and completed users may enter `/dashboard`. Dashboard rendering waits for both authentication and profile loading.

Onboarding version 1 has seven steps: Welcome, Primary Currency, Country/Locale/Timezone, Financial Priorities, Account Intent, Goal Intent, and Review. Every successful Continue or Back writes the resumable `onboardingStep` and current answers with a server timestamp. Save failures retain local inputs and do not advance. Completion sets `onboardingCompleted`, step 7, and version 1.

The progress indicator uses progressbar semantics, step headings receive focus, and choices use `aria-pressed`, text, check marks, and borders. Global reduced-motion rules simplify transitions.

Account setup stores only `add-later` or `skip` and creates no account. Goal setup stores an intent ID or `skip` and creates no goal. Layer 5 defines financial contracts, Layer 7 accounts, and Layer 13 goals.

Credential-free tests validate route decisions, step normalization, versioning, unauthenticated routing, and responsive fallbacks. Live Firestore persistence and verified-user completion require configured Firebase.
