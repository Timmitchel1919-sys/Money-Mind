# Money Mind 2.0 Authentication

## Firebase services

Layer 3 uses the Firebase Web SDK for Authentication and Firestore. `lib/firebase/client.ts` lazily initializes one Firebase app and exposes Auth and Firestore through `getFirebaseClientServices()`. This keeps credential-free builds safe while ensuring runtime configuration failures are explicit. No Admin SDK, server credential, token persistence, or emulator routing is included.

Required public configuration is documented in `.env.example`: API key, auth domain, project ID, storage bucket, messaging sender ID, and app ID. These Firebase web identifiers are not server secrets, but real values belong in untracked `.env.local`.

## Providers and flows

Supported providers are email/password and Google popup authentication. Registration updates the Firebase display name, creates the initial profile when absent, and sends verification email. Login restores the intended internal dashboard URL. Forgot password uses Firebase-hosted email action handling and always returns an enumeration-resistant response except for local configuration errors.

`AuthProvider` observes Firebase with `onAuthStateChanged`; it does not poll. It exposes application-safe user fields, authentication/loading state, verification state, and an explicit reload operation. Firebase objects remain inside service/provider boundaries.

## Route policy

- `/dashboard/**` requires an authenticated user with a verified email.
- Unauthenticated requests are client-redirected to `/login?next=<internal-dashboard-path>`.
- Unverified users are sent to `/verify-email`.
- Authenticated users leave `/login`, `/register`, and `/forgot-password` for either verification or the dashboard.
- `/verify-email` supports resend, reload, and logout; verified users leave it for `/dashboard`.

`sanitizeAuthRedirect()` accepts only same-origin `/dashboard` paths, preventing protocol-relative and external redirects. This Layer 3 guard prevents protected UI display while browser auth resolves. It is not backend authorization.

## User profiles

The profile path is `users/{uid}`. `ensureUserProfile()` first reads the document and returns without writing when it exists, preserving all existing preferences. New profiles contain `uid`, `email`, `displayName`, `photoURL`, `preferredCurrency: null`, browser locale, `theme: "obsidian"`, `onboardingCompleted: false`, and Firestore server timestamps for creation/update. Passwords and tokens are never stored.

## Errors and security boundary

Known Firebase Auth error codes map to concise user messages. Login deliberately avoids distinguishing unknown email from incorrect password. Unexpected errors receive a generic message, never a raw Firebase string.

Authentication answers who the user is. Firestore Security Rules and server-side validation must later authorize which records and actions that identity may access. A production server-session enhancement can exchange a Firebase ID token for a validated, secure HTTP-only session cookie using a server-only Admin SDK. That is intentionally deferred.

## Runtime prerequisite

Real end-to-end account flows require a configured Firebase project with Email/Password and Google providers enabled and Firestore access appropriate for initial profile creation. Automated credential-free QA validates routing, presentation, form validation, error handling, and configuration failure behavior without introducing mock production authentication.
