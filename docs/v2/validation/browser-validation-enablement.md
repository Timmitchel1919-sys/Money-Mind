# Browser validation enablement

- Date: 2026-08-21
- Branch: `develop/v2`
- Target: `http://127.0.0.1:4178/#spatial`
- Result: **ENABLED**

## Repository and runtime safety

Validation began with a clean worktree on `develop/v2` at `05ee76e`. The V1 restore points (`v1.0.0` and `backup/v1-pre-v2`) remained at `168e05e`. The Vite process received `VITE_V2_ENABLED=true` and `VITE_V2_SPATIAL_UI=true` only in its temporary process environment; no local environment file was created or changed.

## Tooling inspection

| Capability | Finding |
| --- | --- |
| Operating system | Windows NT 10.0.26200.0 |
| Node/npm | Node 24.18.0; npm 11.16.0 |
| Installed browsers | Chrome and Edge executables present |
| Project browser dependencies | No Playwright, Puppeteer, Selenium, or WebDriver dependency/configuration |
| Integrated Browser | Runtime loaded successfully, but `getForUrl()` returned `No browser is available`; the required one-time browser list returned `[]` |
| Existing local fallback | Playwright 1.62.1 plus matching cached Chromium revision 1234 / Chromium 151.0.7922.34 |
| Compatibility | Playwright requires Node >=20; Node 24 satisfies the package engine |
| Network | Localhost worked; the sandbox denied the external Google Fonts stylesheet |

## Decision and implementation

The integrated Browser connection was genuinely retried and diagnosed before fallback. Because the brief explicitly authorized a fallback and a complete matching Playwright/Chromium pair already existed locally, that pair was reused directly. No package was installed, no browser was downloaded, no test framework was added, and `package.json`/the lockfile were unchanged.

The fallback provided the required real browser surface: Canvas and WebGL inspection, screenshots, pointer and keyboard input, console/page error capture, request-failure tracing, and exact viewport control.

## Validation coverage enabled

- Chromium 151 headless session with a live WebGL context
- Six viewport cases: 1600×900, 1366×768, 1024×768, 768×1024, 390×844, and 360×800
- Pointer hover/click and empty-canvas click
- Tab, Shift+Tab, Enter, and Space
- Camera focus/reset and selection state
- Auto, low, medium, high, and ultra quality modes
- Full, reduced, minimal, and off motion modes
- Forced WebGL-unavailable fallback
- Console, page-error, network-failure, DOM-state, and screenshot evidence

## Persistent project impact

Browser enablement itself added only documentation and validation screenshots. It did not add a browser dependency or permanent server configuration. Acceptance-driven runtime corrections are documented separately in `layer-2c-visual-runtime-acceptance.md`.

## Decision

**BROWSER VALIDATION ENABLED**
