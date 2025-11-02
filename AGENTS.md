# Repository Guidelines

## Project Structure & Module Organization
The Next.js 15 app directory drives routing; shared layouts live in `app/layout.tsx`, while feature routes are grouped under folders like `app/(auth)` and `app/(dashboard)`. Client-only styles sit in `app/globals.css`. Keep shared presentation components in `components/` (UI primitives under `components/ui/`), and colocate React Query helpers in `hooks/`. Place cross-cutting utilities—such as auth context and Supabase clients—in `lib/` and `supabase/`. Static assets, favicons, and images belong inside `public/`. Configuration for linting, Tailwind, and TypeScript is defined by the `.mjs` and `.ts` files at the project root; edit these sparingly and document any changes.

## Build, Test, and Development Commands
Install dependencies with `pnpm install`. Use `pnpm dev` for local development (Turbopack enabled), `pnpm build` to generate a production bundle, `pnpm start` to serve the compiled app, and `pnpm lint` (optionally `pnpm lint --fix`) before every commit to enforce formatting and static analysis. Manual feature verification steps are documented in `TESTING_GUIDE.md`; follow them after significant UI or data changes.

## Coding Style & Naming Conventions
Write TypeScript-first React components with functional patterns. Use two-space indentation, trailing commas where supported, and keep imports sorted alphabetically within logical groups. Export components with PascalCase names (e.g., `StudySetsList`), use camelCase for hooks and helpers, and prefer kebab-case for filenames (`use-client-fetch.ts`). Keep Tailwind utility classes ordered from layout to state modifiers for readability. When adding new components, place shared primitives in `components/ui/` and feature-specific views alongside their route when appropriate.

## Testing Guidelines
Automated tests are not yet configured; rely on `TESTING_GUIDE.md` to run the documented end-to-end flows against Supabase-backed data. When adding tests, scaffold React Testing Library suites under `__tests__/` and name files `*.test.tsx`. Supply deterministic seed data or Supabase mocks to keep scenarios repeatable. Confirm authentication flows, dashboard listings, and study set detail pages before requesting review.

## Commit & Pull Request Guidelines
Follow the existing history by writing concise, imperative commit subjects (e.g., “Add study sets dashboard”). Each PR should include a summary of functional changes, screenshots or screen recordings for visible UI updates, affected routes, and Supabase schema adjustments. Link related issues, note any follow-up tasks, and verify `pnpm lint` and the manual test pass locally before submitting.

## Environment & Configuration Tips
Store secrets in `.env.local`, ensuring `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present before running Supabase clients. If you introduce new environment variables, add typed accessors in `lib/` and document them in `README.md`. For production hardening, revisit RLS rules described in `TESTING_GUIDE.md` and confirm filters in `components/study-sets-list.tsx` default to user-specific data.
