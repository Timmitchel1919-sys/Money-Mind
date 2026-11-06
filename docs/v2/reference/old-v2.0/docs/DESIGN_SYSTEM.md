# Money Mind 2.0 Design System

## Foundations

Layer 1 implements the Obsidian Financial Intelligence theme through semantic CSS custom properties in `styles/tokens.css`. Components consume semantic background, surface, text, financial-status, spacing, radius, elevation, motion, and focus tokens rather than raw palette values.

The current theme is dark. The semantic indirection is the extension point for the future Pearl Financial theme; components should not add scattered light/dark classes.

## Materials

`styles/materials.css` defines subtle, standard, elevated, and premium glass. Depth comes from distinct opacity, border strength, ambient shadow, internal highlight, specular gradient, and restrained blur. Avoid nesting multiple backdrop-filter surfaces.

## Typography and numbers

Typography utilities cover display, heading, body, label, caption, micro, financial, percentage, and data-label roles. Financial values use tabular lining numerals. Display components receive already-formatted values and do not perform financial calculations.

## Responsive strategy

Use Tailwind's default mobile-first breakpoints consistently:

- Mobile: below `640px`; single-column content and full-width controls.
- Tablet: `640px` to `1023px`; selective two-column groups.
- Laptop: `1024px` to `1279px`; compact multi-column financial layouts.
- Desktop: `1280px` to `1535px`; full component and analytics grids.
- Wide desktop: `1536px` and above; capped content width prevents excessive line length.

Interactive controls generally use a 44px default minimum height. Layout primitives live in `styles/utilities.css`; use straightforward Tailwind composition when a shared layout class would not improve consistency.

## Accessibility

Interactive primitives preserve keyboard behavior, accessible names, visible focus, disabled states, and error announcements. Radix primitives provide focus management and keyboard interaction for complex controls. Status is communicated with text and directional icons in addition to color. Global reduced-motion rules retain state changes while shortening decorative animation.

## Development preview

Run `npm run dev` and open `/dev/design-system`. A narrowly matched Next.js proxy returns HTTP 404 for this route in production. Responsive and interaction checks can be run with `npm run test:visual` while the development server is running.
