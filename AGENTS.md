# WANI — agent guidance

Two independent Bun packages, not a monorepo. Each has its own `bun.lock` and `tsconfig.json`.

## Commands

**Dashboard** (`dashboard/`):
- `bun run dev` — Vite dev server (HMR)
- `bun run build` — `tsc -b` (project references) then `vite build`
- `bun run lint` — `eslint .` (flat config)
- `bun run preview` — `vite preview`

**API** (`api/`):
- `bun install && bun run index.ts`

## Architecture

- **dashboardsrc/** — React 19 + TypeScript 6 + Vite 8 (Rolldown, not esbuild)
- **api/src/index.ts** — Bare Bun HTTP entrypoint (single file, no framework)
- **dashboard/vite.config.ts** — Uses `@vitejs/plugin-react` + `@rolldown/plugin-babel` with `reactCompilerPreset` (React Compiler enabled)
- **erd.excalidraw** — Full data model: MERCHANT, CUSTOMER, CATEGORY, PRODUCT, ORDER, ORDER_ITEM, PAYMENT, CONVERSATION, MESSAGE, WA_SESSION, AI_AGENT, SETTING, ACTIVITY_LOG

## Quirks

- `verbatimModuleSyntax` is on — use `import type` for type-only imports
- Dashboard has TypeScript project references: `tsconfig.app.json` (src/) + `tsconfig.node.json` (vite.config.ts)
- ESLint 10 flat config with `eslint/config` module — not `.eslintrc*`
- `erasableSyntaxOnly` in tsconfig — no enums, no namespaces, no `constructor` parameter properties
- `tsc -b` before vite build ensures type errors block the build
- No test framework installed
- `.gitignore` ignores `erd*` pattern
- `graphify-out/` — graphify knowledge graph outputs; use `graphify query` to explore
