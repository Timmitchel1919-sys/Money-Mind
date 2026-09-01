# V1 safety baseline

## Original repository state

Inspection began on `develop/v2` at `2e3ecf5`. The working tree contained 58 modified or deleted tracked files and 27 untracked files carried forward from pre-existing V1 work. Nothing was discarded, stashed, or overwritten.

## Classification

- Legitimate V1 source: React application, authentication UX, hash routing, navigation/page information, theme UI, Money AI client and Firebase Functions backend, Firestore history clearing, and Remotion composition source.
- Legitimate V1 configuration: root and Functions package metadata, Functions lockfile, Vite/PWA settings, HTML metadata, and focused `.gitignore` additions.
- Runtime assets: public theme previews, cleaned logo, and login background video.
- Intentional removals: the superseded `AuthIntro.jsx` and `public/videos/money-mind-intro.mp4` used by the previous login experience.
- Generated files excluded: all rendered videos and preview frames under `out/`.
- Local-only files excluded: dependency directories, Firebase local state, logs, editor/agent state, and local environment files already covered by `.gitignore`.
- Sensitive files excluded: `.env` remained ignored and was not staged. No private-key material, service-account file, or literal API credential was found in the staged content. `OPENAI_API_KEY` appears only as a Firebase `defineSecret` name and validation reference.
- Unclear files: none remained after source/runtime/generated classification.

## Baseline result

- Original committed baseline: `4ffa43d`
- Validated V1 commit: `168e05e`
- Safety branch: `backup/v1-pre-v2`
- Annotated restore tag: `v1.0.0`
- V2 foundation retained: `develop/v2` contains `2e3ecf5`
- Integration: the safety baseline was merged into `develop/v2` without rebasing or altering either commit.

## Validation evidence

Validated on 2026-08-21 before tagging:

| Check | Result | Detail |
| --- | --- | --- |
| Root dependency verification | Passed | `npm ls --depth=0`; three pre-existing extraneous TanStack packages reported |
| Functions dependency verification | Passed | Firebase Admin, Firebase Functions, and OpenAI resolved |
| Lint | Passed with warnings | Eight existing warnings; no lint errors |
| Production/PWA build | Passed | 2,460 modules transformed; service worker generated |
| Syntax checks | Passed | Functions entry and changed service modules passed `node --check` |
| Tests | Unavailable | No test script or test framework is configured |
| Typecheck | Unavailable | No installed TypeScript compiler; current TypeScript config covers Remotion only |
| Application startup | Passed | Vite started and returned HTTP 200 with the root and application entry |

Known non-blocking warnings are unused values in `functions/index.js`, `PublicExperience.jsx`, and `PortfolioDashboard.jsx`; React hook dependency warnings in `useAuth.js`, `useRetirement.js`, and `AIFinancialCoach.jsx`; and a production bundle chunk larger than 500 kB.

## Remaining local files

The V1 branch was clean after the baseline commit. Generated renders under `out/` and the local `.env` remain on disk but are ignored and are not part of the baseline.

## Recovery

Inspect V1 without changing a branch:

```bash
git switch --detach v1.0.0
```

Create a recoverable working branch from V1:

```bash
git switch -c restore/v1 v1.0.0
```

No destructive reset or clean command is required. The safety branch and tag are local until explicitly pushed.
