# PartyMap contributor guide

## Commands

- `npm install` installs project dependencies.
- `npm run dev` starts the Vite development server.
- `npm run check` synchronizes SvelteKit types and runs Svelte/TypeScript checks.
- `npm run test` runs the Vitest suite once.
- `npm run build` creates the static SPA build.
- `npm run preview` serves the production build locally.

## Folder ownership

- Root configuration and `src/routes/+layout.*`: application scaffold and SPA settings.
- `src/lib/types.ts`: shared domain, configuration, graph, and UI types.
- `src/lib/constants`: default settings and sample relationship data.
- `src/lib/stores`: generator and standalone state, derived names, and store actions.
- `src/lib/graph`: graph generation interfaces and implementation.
- `src/lib/url`: URL state serialization and synchronization.
- `src/lib/viz`: DOT-to-SVG rendering.
- `src/lib/export`: PNG, SVG, and ZIP export behavior.
- `src/lib/components`: reusable Svelte UI components.
- `src/routes`: generator and standalone edit page composition.

`map.js` and `sample.csv` are source reference files and must remain unchanged.
