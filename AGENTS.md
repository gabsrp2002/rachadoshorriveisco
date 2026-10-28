<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Racha dos Horríveis — Developer & Agent Guidelines

## 1. Project Overview & Architecture

**Racha dos Horríveis** (`rachadoshorriveisco`) is the official web portal for the Racha dos Horríveis soccer group. It tracks match history, player attendance, goals, assists, standings, and group statistics.

### Tech Stack
- **Package Manager:** `pnpm`
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (Strict Mode)
- **Deployment & Runtime:** Cloudflare Workers via `@opennextjs/cloudflare` + Wrangler
- **Database & ORM:** SQLite (Cloudflare D1 in production/preview + local SQLite via Prisma ORM 6 & `@prisma/adapter-d1`)
- **Testing:** Vitest + React Testing Library
- **Linting & Static Analysis:** ESLint 9 (flat config) + Semgrep
- **Styling:** CSS variables & responsive layout system (`src/app/globals.css`)

### Core Architecture & Key Modules
- **Database Layer (`src/lib/db/` & `prisma/`):**
  - `prisma/schema.prisma`: SQLite schema for users, players, matches, and match statistics.
  - `src/lib/db/prisma.ts`: Resolves a `PrismaClient` bound to Cloudflare D1 (`env.DB`) when running inside the Cloudflare/OpenNext runtime context, or falls back to a singleton local SQLite client (`DATABASE_URL`) during local scripts and unit tests.
  - `src/lib/db/repositories/`: Dedicated data access repositories encapsulating Prisma queries.
- **API Layer — Single-Function Bundle (`src/app/api/[[...slug]]/route.ts` + `src/lib/api/handlers/`):**
  - All `/api/*` endpoints are served by ONE catch-all dispatcher mapping `(method, slug)` to handler functions (`404` unknown path, `405` wrong method). This keeps serverless bundle sizes minimal and centralizes request tracing (`x-request-id`).
  - Handlers live in `src/lib/api/handlers/<name>.ts` with per-module-suffixed exports (e.g. `GET_auth_me`, `GET_health`). To add an endpoint: create the handler, wire it into `ROUTE_TABLE` in `src/app/api/[[...slug]]/route.ts`, and add handler + dispatcher tests.
  - **NEVER create new `src/app/api/**/route.ts` files** — all endpoints must go through the single dispatcher.
- **Authentication & Security (`src/lib/auth/` & `src/lib/security/`):**
  - `src/lib/auth/session.ts`: Stateless HMAC-SHA256 signed session cookies using Web Crypto API (compatible with both Node.js and Cloudflare Workers).
  - `src/lib/security/encryption.ts`: AES-256-GCM payload encryption helpers (`enc:v1:...`).
  - Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are enforced globally in `next.config.ts`.

---

## 2. Local Development Server

### How to Start the Server
```bash
pnpm dev
```

To preview the production Cloudflare Worker bundle locally with Wrangler:
```bash
pnpm preview
```

### ⚠️ CRITICAL AGENT INSTRUCTION: Do NOT Start the Dev Server Automatically
- **Agents must NEVER start the local development server (e.g., `pnpm dev`, `next dev`, `wrangler dev`, or background daemon processes) unless the user explicitly and specifically asks to start the local server.**
- Starting long-running servers unprompted consumes system ports, database locks, and background task slots without user consent.

---

## 3. Quality Verification: Tests, Typechecks & Linting

Before making changes and before concluding any task, agents must ensure all quality gates pass cleanly.

### Verification Commands

1. **Automated Unit Tests:**
   ```bash
   pnpm test
   ```
   - Must run and pass all test suites.
   - When modifying logic, always add or update corresponding unit tests in `__tests__/`.
   - Component behavior tests (page state, effects, user interaction) belong in `__tests__/` next to the page or component and run in jsdom via a `// @vitest-environment jsdom` pragma (global setup: `vitest.setup.ts`).

2. **TypeScript Compilation (Typechecking):**
   ```bash
   pnpm typecheck
   ```
   - Must compile with 0 type errors. Ensure Prisma types are generated (`pnpm prisma generate`) if schema changes occur.

3. **Code Linting:**
   ```bash
   pnpm lint
   ```
   - Must report 0 lint errors or warnings.
   - Strict import rules are enforced via `eslint.config.mjs`:
     - **Path Alias Imports Only (`@/`):** Relative imports (`./`, `../`) are forbidden in `src/`. Always use `@/` alias imports.
     - **Named Imports/Exports Only:** Wildcard imports (`import * as ...`) and wildcard exports (`export * from ...`) are forbidden.

### Verification Rule for Agents
> **Always verify that `pnpm test`, `pnpm typecheck`, and `pnpm lint` are completely clean before and after making changes. Never leave failing tests, broken types, or lint issues.**

---

## 4. Database & Migrations Guidelines

- Any modification to `prisma/schema.prisma` **must** include a corresponding SQL migration generated in `prisma/migrations/`:
  ```bash
  pnpm db:migrate
  ```
- Never commit changes to `prisma/schema.prisma` without staging the generated migration files in `prisma/migrations/` (enforced by `.githooks/pre-commit`).
- To apply migrations to Cloudflare D1:
  - Local D1 database: `pnpm db:migrate:local`
  - Remote production D1 database: `pnpm db:migrate:remote`
- Do not instantiate `new PrismaClient()` directly outside `src/lib/db/prisma.ts`, and never use string concatenation in raw SQL queries.

---

## 5. Git, Rebase & Pull Request Workflow

Agents must follow this clean Git workflow for all task deliveries:

1. **Rebase on `main` for Any Conflicts:**
   - Always fetch and rebase against the latest `main` branch:
     ```bash
     git fetch origin
     git rebase origin/main
     ```
   - If merge conflicts occur, resolve them cleanly, re-verify all tests, typechecks, and linting, and continue the rebase (`git rebase --continue`).
   - Do **not** use merge commits to bring changes from `main`; maintain a clean, linear git history.

2. **Single Commit:**
   - Unless explicitly instructed otherwise by the user, squash/combine changes into a **single, well-crafted, semantic commit**:
     ```bash
     git add -A
     git commit -m "feat(scope): descriptive summary of changes"
     ```
   - Use conventional commit prefixes: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

3. **Pull Request (PR):**
   - When working on feature branches, create a single PR with the desired changes detailing:
     - Summary of changes and why they were made.
     - Verification steps and automated test results.
     - Any breaking changes or configuration updates.

---

## 6. Frontend Authentication & Route Protection Guidelines

Authentication and role-based access control (RBAC) must follow these strict conventions:

### 1. Server-Side Protection via Middleware (`src/proxy.ts`)
- In Next.js 16, route-level protection is handled server-side in `src/proxy.ts` (Next.js middleware convention for this repository).
- All protected and role-restricted routes **must be configured in `src/proxy.ts`**:
  - `isProtectedRoute`: Routes requiring a valid session (e.g. `/dashboard`, `/admin`, `/settings`). Unauthenticated requests are automatically redirected to `/login?redirect=<path>`.
  - `isAdminOnlyRoute`: Routes restricted to `admin` users (e.g. `/admin`, `/settings`). Authenticated non-admin users (`role !== 'admin'`) are automatically redirected to `/dashboard`.
  - `config.matcher`: Ensure any new protected top-level route is registered in the middleware matcher array.

### 2. ⚠️ NEVER Check Auth Manually in Client Components (`useEffect` / `/api/auth/me`)
- **Do NOT** use `useEffect` or client-side redirects (`router.push('/login')` or `router.push('/dashboard')`) to guard pages.
- **Do NOT** call `/api/auth/me` on page mount just to check if the user is authenticated or an admin.
- **Why this is forbidden:**
  - `src/proxy.ts` guarantees that unauthenticated or unauthorized users never reach the page component.
  - Adding client-side auth checks causes unnecessary network roundtrips, flash-of-loading-state (unwanted skeletons/flicker), and risks React Hook lint errors (`react-hooks/set-state-in-effect`).
- **When `/api/auth/me` is acceptable:** Only call `/api/auth/me` if the UI explicitly needs to display the current logged-in user's profile data (e.g., displaying the logged-in user's name in a header or navbar), never as an access control gate.
