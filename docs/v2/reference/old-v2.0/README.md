# Money Mind 2.0

Money Mind 2.0 is a premium personal financial intelligence operating system for managing, understanding, and growing a connected financial life. The product combines accessible financial workflows with restrained motion and optional 3D visualization.

## Repository

`https://github.com/Timmitchel1919-sys/Money-Mind-V2.0-3D`

## Requirements

- Node.js 22 LTS or newer
- npm 10 or newer

## Installation

```bash
git clone https://github.com/Timmitchel1919-sys/Money-Mind-V2.0-3D.git
cd Money-Mind-V2.0-3D
npm install
```

Copy `.env.example` to `.env.local` and provide the Firebase web application values when Firebase-backed features are introduced. Never commit real environment files.

For authentication, enable Email/Password and Google providers in the Firebase project and create a Firestore database that permits authenticated users to create their own initial `users/{uid}` profile under the project's security rules. Do not place Admin SDK credentials in public environment variables.

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment variables

The tracked `.env.example` documents the required public Firebase configuration names. Server credentials must use server-only environment variables and must never be exposed through a `NEXT_PUBLIC_` prefix.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for product boundaries, rendering rules, backend direction, and the security model.

See [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) for Layer 1 tokens, materials, responsive behavior, and accessibility conventions.

See [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md) for authentication providers, route policy, profile creation, and production security boundaries.
