# Money Mind 2.0 User Profile

Profiles live at `users/{authenticatedUid}` and are cached for the active session by `ProfileProvider`. Missing documents are recovered through the idempotent initializer. Screens consume `useProfile()` instead of issuing independent reads.

The profile contains identity, standardized region, locale, IANA timezone, ISO currency, date/number formats, Obsidian theme, stable financial-priority IDs, lightweight account/goal intent, onboarding state/version, and server timestamps.

Service operations are `ensureUserProfile`, `getUserProfile`, `updateUserProfile`, `updateOnboardingProgress`, and `completeOnboarding`. Writes derive the UID from Firebase Auth, allow explicit typed fields, validate collected values, and never accept a UI-controlled target UID. Partial updates preserve identity, creation timestamp, photo, and unrelated fields.
