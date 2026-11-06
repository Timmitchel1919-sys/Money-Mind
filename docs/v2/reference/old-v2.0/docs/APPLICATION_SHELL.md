# Money Mind 2.0 Application Shell

## Structure

Authenticated application routes share `app/(app)/layout.tsx`. The layout mounts one client-side `AppShell`, so the sidebar and top bar retain state during client navigation while route pages remain Server Components. Financial business logic and Firebase are outside this shell boundary.

## Navigation

`config/navigation.ts` is the single source for desktop and mobile navigation. It defines Core, Wealth, Intelligence, and System sections with Lucide icons. An item is active when the pathname exactly matches its route or begins with that route plus `/`; Overview matches `/dashboard` exactly. Active links include `aria-current="page"`, a mint surface, and a non-color-only indicator.

The desktop sidebar is `17rem` (272px) expanded and `4.75rem` (76px) collapsed. These values, plus the 72px top bar height, are CSS tokens. Collapsed links retain 44px targets and expose Radix tooltips.

## State and persistence

The shell owns only `sidebarCollapsed` and `mobileNavOpen`. Collapse preference is stored as `money-mind:sidebar-collapsed:v1` in localStorage and read with `useSyncExternalStore`, including a stable server snapshot to prevent hydration mismatches. Mobile drawer state is transient and is never persisted.

## Responsive behavior

The `lg` breakpoint (1024px) separates desktop from compact navigation. At and above 1024px, the persistent collapsible sidebar owns workspace inset. Below 1024px, the desktop sidebar disappears and a left Radix Sheet opens from the top bar. Tablet therefore uses the mobile drawer. Both modes consume the same route configuration. Content supports `standard` (72rem) and `wide` (90rem) workspace widths.

## Top bar

The persistent glass-subtle top bar contains mobile navigation, route-aware breadcrumbs, a keyboard-focusable global search placeholder, Quick Add menu, USD base-currency placeholder, notification placeholder, and a placeholder user menu. Search focuses with Ctrl+K or Command+K. No control implements business data or authentication.

## Accessibility and motion

The shell includes a skip link, semantic navigation and breadcrumbs, accessible button names, visible focus, 44px targets, route state, tooltips, and Radix focus trapping/ESC behavior in the mobile Sheet and menus. Selecting a mobile route closes the Sheet. Global reduced-motion rules collapse shell transition durations.
