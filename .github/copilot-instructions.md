# GitHub Copilot / AI Agent Instructions for Nettoyage Plus 🔧

Purpose: concise, actionable notes to make an AI coding agent productive quickly in this repo.

---

## Quick Start (dev) ✅
- Start everything: run `start-dev-zied.bat` from the repo root (Windows) — it starts backend then frontend.
- VS Code Tasks available: **Start Backend (NestJS)** and **Start Frontend (Vite)**. Backend script: `npm run start:dev` (cwd: `backend`). Frontend script: `npm run dev` (cwd: `frontend`).
- Backend URL (default): http://localhost:3000/api (global API prefix `api`) — see `backend/src/main.ts`.
- Frontend default port: 5173 (used by password reset links) — see `backend/src/modules/auth/auth.service.ts`.

---

## Big picture (why & where) 🧭
- Monolith backend: NestJS modules under `backend/src/modules/*` (controller + service + dto + entities). Add new features as modules.
- DB & ORM: TypeORM + PostgreSQL (Supabase). Entities auto-loaded (`backend/src/config/database.config.ts`) and `synchronize: false` is set.
- Shared utilities & types: `backend/src/shared/*` (e.g., `shared/utils/password.util.ts`, `shared/types/*`).
- Cross-cutting concerns (guards/decorators): `backend/src/common/*`. Keep global logic minimal and module-focused.

---

## Auth, roles & routes 🔐
- Auth guard applied globally via `APP_GUARD` + `JwtAuthGuard` in `backend/src/app.module.ts`. Use `@Public()` to expose endpoints (`backend/src/common/decorators/public.decorator.ts`).
- Role-based access: `@Roles(...)` decorator and `UserRole` enum (`backend/src/shared/types/user.types.ts`).
- JWT payload shape: `{ sub: userId, email, role }` (see `modules/auth/strategies/jwt.strategy.ts`).
- Password hashing & helpers: `backend/src/shared/utils/password.util.ts`.

---

## Request validation & conventions ✅
- Global ValidationPipe in `backend/src/main.ts`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — DTO-first validation is required.
- Global route prefix: `/api`.

---

## Database & Migrations ⚠️
- Database: PostgreSQL via `DATABASE_URL` (Supabase recommended). See `backend/src/config/database.config.ts`.
- `synchronize: false` (production-safe). No automatic schema sync — expect migrations or manual schema management during deploy. We didn't detect a migrations folder or CI workflow in this workspace (add migrations/CI when needed).

---

## External Integrations & Env Vars 🔌
- JWT secrets and expirations: `JWT_SECRET`, `JWT_EXPIRATION`. Default secret is present in code for dev — **change in production**. See `backend/src/config/configuration.ts`.
- Database: `DATABASE_URL` (required for real DB). See `getDatabaseConfig()`.
- Email: uses Resend (`RESEND_API_KEY`) — in development the service logs password reset URLs; in production `RESEND_API_KEY` is required and will throw if missing. See `backend/src/modules/email/email.service.ts`.
- Frontend URL for reset links: `FRONTEND_URL` (default `http://localhost:5173`).
- Optional: Supabase and Firebase keys: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FIREBASE_*` environment variables.

---

## Deployment & Environments (Dev vs Production) ⚙️
- Database: This project uses a single Supabase PostgreSQL instance for both development and production (set via `DATABASE_URL`). **Development and production point to the same online Supabase DB** — avoid destructive schema changes or destructive seeds while developing; coordinate with the team before migration or large data changes.
- Development workflow: run `start-dev-zied.bat` from the repo root (Windows) — it starts the backend (`npm run start:dev` in `backend`) and then the frontend (`npm run dev` in `frontend`). Local dev uses the same Supabase DB by default (see `back/env` or `back/env.supabase`).
- Production deployment: backend → **Railway**, frontend → **Vercel**. On Railway set required envs: `DATABASE_URL` (Supabase), `JWT_SECRET`, `RESEND_API_KEY` (required in prod), `FRONTEND_URL` (https://<your-vercel-app>.vercel.app), and optional `SUPABASE_*` / `FIREBASE_*` keys. On Vercel set `VITE_API_URL` to your Railway backend URL + `/api` so the frontend points to the correct backend.
- Email behavior: in development the email service logs password reset URLs (no `RESEND_API_KEY` needed). In production `RESEND_API_KEY` is required and the service will throw if missing — see `backend/src/modules/email/email.service.ts`.
- Migrations & schema: `synchronize: false` (TypeORM). There are no migrations in the repo; before deploying to production apply schema changes to Supabase (use TypeORM migrations or manual SQL). Since dev and prod share the same DB, run migrations carefully and coordinate timing.
- Env file examples: `back/env`, `back/env.supabase`, `front/env`, `front/env.production`.

### Environment variables (actual list) 🔑
For development and production you will typically need to set the following variables (examples are present in `back/env` and `front/env`):

- NODE_ENV — `development` or `production`
- PORT — backend port (default 3000)
- DATABASE_URL — Supabase Postgres connection string (shared between dev & prod)
- JWT_SECRET — JWT signing secret (change for production)
- JWT_EXPIRATION — token expiration (e.g., `7d`)
- SUPABASE_URL — (optional) Supabase project URL
- SUPABASE_ANON_KEY — (optional) Supabase anon/public key
- FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL — (optional) Firebase service account for storage/notifications
- RESEND_API_KEY — Resend API key (required in production for sending emails)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM — (optional) SMTP fallback / demo credentials
- FRONTEND_URL — used to build password reset links (dev: `http://localhost:5173`)
- VITE_API_URL — frontend environment (set in Vercel to point to Railway backend + `/api`)

> Tip: See `back/env` and `back/env.supabase` for backend examples and `front/env` and `front/env.production` for frontend examples.

### Repository privacy & secrets ⚠️
- This repository is private and contains development env files for convenience. **Before making the repo public or when moving to production, remove any committed secrets** (the team plan is to remove these files before a public release).
- Use platform secrets (Railway, Vercel) or a secret manager in production and rotate secrets when switching environments.
- When working locally, prefer a local `.env` or your OS environment variables instead of committing secrets to the repository.

---

## Code Patterns & Conventions 🧩
- Feature modules: Put DTOs under `modules/<feature>/dto`, entities under `modules/<feature>/entities`. Keep controller/service names consistent (`<feature>.controller.ts`, `<feature>.service.ts`).
- DTOs are the source of truth for request validation (ValidationPipe + class-validator expected). Always add DTO fields explicitly.
- Reusable types: prefer `shared/types/*` enums instead of string literals for roles/status.
- Logging: services use Nest `Logger` (follow existing messages format to keep logs consistent).
- Security: never change `JWT_SECRET` or `RESEND_API_KEY` behavior — tests and dev flows expect fallback behaviors (e.g., email logged in dev).

---

## Testing / CI / Missing pieces ⚠️
- No test files or CI workflows were found in this workspace. Add unit tests (`*.spec.ts`) and GitHub Actions workflows when adding features.
- Migration tooling isn't present in repo; add TypeORM migrations or a database migration pipeline for production deployments.

---

## Examples to Reference (Quick links) 🔎
- Global server & validation: `backend/src/main.ts` (CORS, ValidationPipe, global prefix)
- Auth module & JWT strategy: `backend/src/modules/auth/*` (token gen, reset flow)
- Guards & decorators: `backend/src/common/guards/*`, `backend/src/common/decorators/*`
- Password helpers: `backend/src/shared/utils/password.util.ts`
- Database config: `backend/src/config/database.config.ts` and `configuration.ts`

---

## When in doubt (how to proceed) 💡
- Follow existing module structure and DTO-first validation. Add `@Public()` to routes intended to be open and `@Roles(...)` for restricted APIs.
- If adding any networked dependency (Resend, Supabase, Firebase), provide a clear dev fallback (like existing email logging behavior) and document required env variables in the PR.

---

Please review and tell me what's unclear or missing — I can iterate on examples or add a checklist for PR reviewers. ✍️
