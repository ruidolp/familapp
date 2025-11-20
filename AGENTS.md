# Repository Guidelines

## Project Structure & Module Organization
The Next.js 15 App Router lives in `src/app`; Clean Architecture layers follow the README diagram: `src/domain` (entities/enums), `src/application` (use cases/services), `src/infrastructure` (database, config, auth, utils), and `src/presentation` (components, hooks, providers). Shared translations sit in `src/i18n`, middleware logic in `src/middleware.ts`, and assets in `public/`. Kysely outputs to `src/infrastructure/database/types.ts`, so treat that folder as generated.

## Build, Test, and Development Commands
- `npm run dev` – Runs the local Next.js + React 19 dev server with hot reload.
- `npm run lint` – Executes the Next.js ESLint preset to enforce TypeScript, React, and Tailwind rules.
- `npm run build` – Produces the optimized production bundle and validates routes, i18n, and server actions.
- `npm run start` – Serves the result of the latest build and should mirror Vercel’s runtime.
- `npm run db:types` – Invokes `kysely-codegen` to sync schema changes into `src/infrastructure/database/types.ts`.

## Coding Style & Naming Conventions
Use TypeScript everywhere, keep modules small, and prefer pure functions inside `domain` and `application`. Components belong in `src/presentation/components`, named with PascalCase files that export a matching default function. Hooks live in `src/presentation/hooks` and start with `use`. Styling relies on Tailwind utilities plus shadcn/ui tokens; avoid ad-hoc CSS. Follow ESLint feedback, stick to 2-space indentation, and keep configuration tweaks inside `src/infrastructure/config/app.config.ts`.

## Testing Guidelines
Automated suites are being stood up (see README “Testing Próximamente”). Until the official script lands, colocate Jest/Vitest specs as `*.spec.ts(x)` beside the code or under a nearby `__tests__` folder, mock infrastructure boundaries, and gate changes with `npm run lint`. Target ≥80% coverage for use cases and critical UI flows, and note manual verification steps in PR descriptions when no automated test exists.

## Commit & Pull Request Guidelines
Recent history mixes plain imperative messages with Conventional Commits (e.g., `feat: Actualizar footer ...`). Prefer the `type: summary` pattern (`feat`, `fix`, `docs`, `chore`) plus a concise, Spanish or English imperative line. Each PR should describe intent, link any issue, list migrations or config toggles touched, and include screenshots/GIFs for UI-facing updates. Note additional steps such as running `npm run db:types`, OAuth setup (see `OAUTH_SETUP.md`), or Capacitor platform syncs when relevant.

## Security & Configuration Tips
Configuration is centralized in `src/infrastructure/config/app.config.ts`; never hardcode secrets in components. Review `SECURITY.md` before touching authentication, and update `capacitor.config.ts` from the provided example when generating mobile builds. Update `OAUTH_SETUP.md` and `SUBSCRIPTIONS.md` whenever OAuth or billing flows change.
