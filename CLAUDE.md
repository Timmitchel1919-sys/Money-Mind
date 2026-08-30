# CLAUDE.md — Money Mind

Shared project context for Claude Code and other Claude surfaces. Read this at
the start of every session before working in this repo.

## What this is
Money Mind is a personal-finance web app: React + Vite frontend, Firebase
backend (Hosting, Authentication, per-user Firestore, Cloud Functions), PWA.
- Repo: github.com/Timmitchel1919-sys/Money-Mind
- Firebase project: money-mind-90176 (default in .firebaserc); Hosting serves dist/
- Live URL: https://money-mind-90176.web.app

## V2 upgrade (current focus)
V2 is an evolutionary upgrade on top of a working V1, gated behind centralized
feature flags. V1 stays the functional baseline; V2 is OFF by default
(VITE_V2_ENABLED unset/false; child flags require it true). Work proceeds in
numbered "layers"; each layer records validation evidence in docs/v2/validation/
before it is accepted. Traceability lives in docs/v2/chapter-registry.yaml.

Status (2026-08-30):
- Layer 1 foundation (feature flags, contracts, tokens, ADRs) — done
- Layer 2 + 2C spatial/visual runtime (R3F/Three, placeholder proof-nodes) — accepted
- Layer 3 motion & interaction engine — ACCEPTED (commit cb98f8b)
- Branch develop/v2 (origin main is at 4ffa43d)
- NEXT: Layer 4 — map real financial data into the spatial nodes (currently placeholders)

## Architecture boundaries (src/)
- app/            composition & configuration
- core/           cross-cutting infra (feature flags, auth, data, security)
- financial/      financial domain models/services (introduced incrementally)
- visualization/  renderer-neutral adapters & visualization models
- spatial/        spatial contracts + rendering runtime
- motion/         motion policy, tokens, orchestration
- ai/             V2 intelligence boundary (existing Money AI unchanged)
- shared/, styles/  reusable code, V2 design tokens

Foundation rules:
1. Financial calculations do not live in rendering components.
2. Renderers consume normalized models via adapters; never query Firestore directly.
3. Critical financial info always has a non-spatial (V1) path.
4. V2 flags default off; child flags require VITE_V2_ENABLED=true.
5. Add a new dependency only in the layer that immediately uses it.
6. Never change Firebase schemas or financial calculations as a side effect of visual work.

## Conventions
- Line endings: LF everywhere, enforced by .gitattributes (* text=auto eol=lf). Do not reintroduce CRLF.
- Commits: Conventional Commits (feat/fix/chore/docs + scope), e.g. `feat(v2): ...`.
- Keep V2 work behind flags; never enable V2 on the live site as a side effect.

## Build / deploy
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build` (outputs dist/)
- Deploy hosting only: `firebase deploy --only hosting`
  (firebase.json also defines Firestore + Functions; scope to hosting to avoid touching them.)

## Notes for cloud / remote sessions
- Firebase/Google endpoints are blocked from the Anthropic cloud sandbox, so `firebase deploy` must run on a local machine.
- node_modules holds host-OS native binaries; a Linux sandbox cannot reuse a Windows install for native deps (e.g. rolldown). Build on the host, or reinstall in the sandbox.
