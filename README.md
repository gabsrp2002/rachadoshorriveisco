# Racha dos Horríveis

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers_%26_D1-F38020?logo=cloudflare)](https://developers.cloudflare.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6_(SQLite)-2D3748?logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-4-yellow?logo=vitest)](https://vitest.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm)](https://pnpm.io/)

Official web portal for **Racha dos Horríveis** — a group of friends who play soccer together. The platform is designed to track match results, player statistics (goals, assists, own goals), attendance, and historical leaderboards.

---

## Table of Contents

- [Overview & Key Features](#overview--key-features)
- [Tech Stack](#tech-stack)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [1. Clone and Install](#1-clone-and-install)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Database Setup & Migrations](#3-database-setup--migrations)
  - [4. Starting the Development Server](#4-starting-the-development-server)
- [Cloudflare Deployment](#cloudflare-deployment)
- [Development Guidelines](#development-guidelines)
  - [Quality Verification Gates](#quality-verification-gates)
  - [Coding Standards & Lint Rules](#coding-standards--lint-rules)
  - [Pre-Commit Hooks](#pre-commit-hooks)
  - [Git, Rebase & Commit Workflow](#git-rebase--commit-workflow)
  - [Authentication & Route Protection (RBAC)](#authentication--route-protection-rbac)
  - [API Organization (Single-Function Bundle)](#api-organization-single-function-bundle)
- [Project Structure](#project-structure)

---

## Overview & Key Features

- **Match & Roster Management:** Record weekly soccer matches, team lineups, scores, and player attendance.
- **Player Statistics & Leaderboards:** Track top scorers (artilharia), assists, attendance streaks, and win rates across seasons.
- **Edge-Ready SQLite Architecture:** Powered by Prisma ORM with SQLite locally and Cloudflare D1 at the edge via `@opennextjs/cloudflare` and `@prisma/adapter-d1`.
- **Role-Based Access Control (RBAC):** Server-side route protection (`src/proxy.ts`) separating public statistics views from admin management tools.
- **Security Hardening:** Stateless HMAC-SHA256 session tokens, AES-256-GCM encryption utilities, strict HTTP security headers, and automated Semgrep static analysis.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Package Manager** | `pnpm` |
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript 5 (Strict Mode) |
| **Edge Runtime & Deployment** | Cloudflare Workers via `@opennextjs/cloudflare` & Wrangler |
| **Database & ORM** | SQLite / Cloudflare D1 + Prisma ORM 6 (`@prisma/adapter-d1`) |
| **Unit Testing** | Vitest 4 + React Testing Library (jsdom) |
| **Code Linting & Security** | ESLint 9 (Flat Config) + Semgrep Static Analysis |

---

## Local Development Setup

### Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: `v20.x` or higher
- **pnpm**: `v10.x` or higher (`corepack enable`)

---

### 1. Clone and Install

Clone the repository and install dependencies using `pnpm`:

```bash
git clone git@github.com:gabsrp2002/rachadoshorriveisco.git
cd rachadoshorriveisco
pnpm install
```

> **Note:** `pnpm install` automatically triggers:
> - `postinstall`: Generates the Prisma Client (`prisma generate`).
> - `prepare`: Configures Git to use repository pre-commit hooks in `.githooks`.

---

### 2. Environment Configuration

Create a `.env.local` file in the project root by copying the example file:

```bash
cp .env.example .env.local
```

#### Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Local SQLite database file path used by Prisma CLI and local fallback | `"file:./data/racha.db"` |
| `SESSION_SECRET` | Secret key used for session cookie HMAC signing and encryption (required in production) | Random 32+ char string |

---

### 3. Database Setup & Migrations

The project uses SQLite with Prisma ORM locally and Cloudflare D1 in production.

| Command | Purpose |
| :--- | :--- |
| `pnpm db:migrate` | Create and apply a new Prisma migration locally (`prisma migrate dev`) |
| `pnpm db:migrate:local` | Apply migrations to the local Wrangler D1 SQLite instance (`wrangler d1 migrations apply DB --local`) |
| `pnpm db:migrate:remote` | Apply migrations to the remote production Cloudflare D1 database |
| `pnpm db:push` | Push schema changes directly to the local SQLite file (`prisma db push`) |
| `pnpm studio` | Open Prisma Studio GUI at `http://localhost:5555` |

---

### 4. Starting the Development Server

To start the local Next.js development server (with OpenNext Cloudflare bindings integration):

```bash
pnpm dev
```

To build and preview the application inside the local Cloudflare Workers runtime (`workerd`):

```bash
pnpm preview
```

---

## Cloudflare Deployment

1. **Create the Cloudflare D1 Database** (first time only):
   ```bash
   pnpm wrangler d1 create rachadoshorriveis-db
   ```
   Copy the returned `database_id` into `wrangler.jsonc` under `d1_databases[0].database_id`.

2. **Apply Database Migrations to Remote D1**:
   ```bash
   pnpm db:migrate:remote
   ```

3. **Build and Deploy to Cloudflare Workers**:
   ```bash
   pnpm deploy
   ```

---

## Development Guidelines

### Quality Verification Gates

All code pushed to the repository must pass all three verification gates with **zero errors and zero warnings**:

1. **Unit Tests (Vitest):**
   ```bash
   pnpm test
   ```
   - When introducing or modifying logic, always include or update unit tests under `__tests__/`.
   - Component behavior tests run in `jsdom`: place them in `__tests__/` next to the page or component with a `// @vitest-environment jsdom` pragma at the top.

2. **TypeScript Compilation (Typecheck):**
   ```bash
   pnpm typecheck
   ```
   - Must compile with **0 type errors**.

3. **ESLint (Code Linting):**
   ```bash
   pnpm lint
   ```
   - Must report **0 lint errors or warnings**.

---

### Coding Standards & Lint Rules

Strict architectural and styling rules are enforced via `eslint.config.mjs` and `.semgrep.yml`:

1. **Path Alias Imports Only (`@/`):**
   - **Forbidden:** Relative path imports (`./`, `../`, `../../components/...`).
   - **Required:** Absolute path alias imports starting with `@/` (e.g., `import { getPrismaClient } from '@/lib/db/prisma'`).

2. **Named Imports and Exports (No Wildcards):**
   - **Forbidden:** Wildcard/star imports (`import * as ...`) and wildcard exports (`export * from ...`).
   - **Required:** Explicit, named imports and exports (e.g., `import { useMemo, useState } from 'react'`).

3. **Prisma Schema & Migrations:**
   - Any modification to `prisma/schema.prisma` **must** include a corresponding migration generated via `pnpm db:migrate` located in `prisma/migrations/`.
   - Never commit changes to `schema.prisma` without staging the generated migration files.

---

### Pre-Commit Hooks

The repository includes an automatic pre-commit hook (`.githooks/pre-commit`) installed during `pnpm install`. Before every commit, it automatically:
- Verifies that any staged `prisma/schema.prisma` changes have accompanying migration files in `prisma/migrations/`.
- Ensures clean dependencies via `pnpm install`.
- Runs `pnpm typecheck`.
- Runs `pnpm lint`.
- Runs `pnpm test`.
- Runs `pnpm build`.

If any check fails, the commit is aborted.

---

### Git, Rebase & Commit Workflow

To maintain a clean and linear commit history:

1. **Rebase against `main`:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```
   - Never use merge commits (`git merge main`) to pull upstream changes.

2. **Single Semantic Commit:**
   - Unless requested otherwise, combine related task changes into a single conventional commit:
     ```bash
     git add -A
     git commit -m "feat(scope): descriptive summary of changes"
     ```
   - Use standard prefixes: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

---

### Authentication & Route Protection (RBAC)

Authentication and role-based access control are handled **server-side in `src/proxy.ts`** (Next.js middleware):

- **Protected Routes:** `/dashboard`, `/admin`, `/settings`. Unauthenticated requests redirect to `/login?redirect=<path>`.
- **Admin-Only Routes:** `/admin`, `/settings`. Authenticated non-admin users redirect to `/dashboard`.

#### ⚠️ Strict Rule on Client-Side Auth Checks
- **Do NOT** use `useEffect` or client-side redirects (`router.push('/login')`) to guard pages.
- **Do NOT** call `/api/auth/me` on component mount just to check if the user is authenticated or an admin.
- The server middleware (`src/proxy.ts`) guarantees unauthenticated/unauthorized users never reach protected page components.

---

### API Organization (Single-Function Bundle)

All backend endpoints are served by a single catch-all dispatcher to minimize serverless bundle overhead and centralize request logging:

- `src/app/api/[[...slug]]/route.ts` — catch-all dispatcher (`export const dynamic = 'force-dynamic'`). Maps `(method, slug)` to a handler; returns `404` for unknown paths and `405` for unsupported methods.
- `src/lib/api/handlers/*.ts` — one module per endpoint group (e.g. `auth_me.ts`, `health.ts`). Exports are suffixed per module (e.g. `GET_auth_me`, `GET_health`).
- **Request tracing:** every request is tagged with an 8-char `x-request-id` header and logged with start/finish timing.

⚠️ **Do NOT create new `src/app/api/**/route.ts` files** — wire all new endpoints through `src/lib/api/handlers/` and `src/app/api/[[...slug]]/route.ts`.

---

## Project Structure

```text
rachadoshorriveisco/
├── .github/workflows/          # GitHub Actions CI (Semgrep static analysis)
├── .githooks/                  # Git pre-commit enforcement hooks
│   └── pre-commit              # Validates migrations, types, lint, tests, and build
├── prisma/                     # SQLite database schema & migrations
│   ├── migrations/             # SQL migration files (compatible with Prisma & Cloudflare D1)
│   └── schema.prisma           # Prisma data models (User, Player, Match, MatchPlayerStat)
├── src/
│   ├── app/                    # Next.js 16 App Router (Pages and API Dispatcher)
│   │   ├── api/[[...slug]]/    # Single catch-all API dispatcher & routing tests
│   │   ├── __tests__/          # Page unit tests (jsdom)
│   │   ├── globals.css         # Global styles & CSS design tokens
│   │   ├── layout.tsx          # Root application layout
│   │   └── page.tsx            # Landing page
│   ├── core/
│   │   └── types/              # Domain TypeScript interfaces (auth, entities)
│   ├── lib/
│   │   ├── api/                # API handler modules & request tracing helper
│   │   ├── auth/               # Stateless HMAC session signing & verification
│   │   ├── db/                 # Prisma D1 / local SQLite client helper
│   │   └── security/           # AES-256-GCM encryption utilities
│   └── proxy.ts                # Next.js route protection middleware (RBAC)
├── .semgrep.yml                # Custom architectural & security Semgrep rules
├── AGENTS.md                   # AI Agent & Developer instructions
├── eslint.config.mjs           # ESLint 9 flat config (enforcing @/ alias & named imports)
├── next.config.ts              # Next.js config with security headers & OpenNext dev init
├── open-next.config.ts         # OpenNext Cloudflare adapter configuration
├── package.json                # Project dependencies and pnpm scripts
├── tsconfig.json               # TypeScript strict configuration
├── vitest.config.mts           # Vitest unit test configuration
├── vitest.setup.ts             # Vitest React 19 & jsdom test environment setup
└── wrangler.jsonc              # Cloudflare Workers & D1 binding configuration
```
