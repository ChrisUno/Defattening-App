# Completion Checklist

> Developer-facing status of all outstanding work before the application can ship to real participants. Entra ID is the primary remaining blocker.

---

## 1. Microsoft Entra ID (SSO) — 🔴 Incomplete

**Status:** Partially implemented. Server endpoint (`POST /api/auth/entra`) and frontend MSAL config exist but have not been validated end-to-end with real Azure AD tenant credentials. Placeholder client/tenant IDs are hardcoded as fallbacks.

### What exists

| Layer | File | Detail |
|---|---|---|
| Server | `server/src/routes/auth.ts` | `/entra` endpoint — verifies JWT via JWKS, resolves user by `entra_oid` or email, auto-provisions new users |
| Frontend | `src/lib/msalConfig.ts` | MSAL `PublicClientApplication` config with `loginPopup` scope |
| Frontend | `src/store/authStore.ts` | `signInWithEntra()` — MSAL popup → access token → `POST /api/auth/entra` → session established |
| DB | `db/migrations/V3__entra_id_fields.sql` | Adds `entra_oid` column to `users` table |
| Docker | `docker-compose.yml` | Env vars: `ENTRA_TENANT_ID`, `ENTRA_API_CLIENT_ID`, `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_API_SCOPE` |

### Steps to complete

1. **Register / confirm Azure AD App Registration** — SPA redirect URI + API scope (`access_as_user`). Ensure `id_token` and `access_token` are enabled.
2. **Set real tenant/client IDs** — Update `.env` or docker-compose environment variables. Remove hardcoded fallback IDs from `msalConfig.ts` and `auth.ts` (or at minimum make them fail loudly in production).
3. **Validate full login flow** — MSAL popup → access token → `POST /api/auth/entra` → session cookie set → `/api/auth/me` returns user.
4. **Test auto-provisioning** — Sign in with a new Entra user that has no pre-existing DB row. Verify user is created with `role: 'user'` and `entra_oid` populated.
5. **Test OID linking** — Sign in with an Entra user whose email matches an existing DB row that has no `entra_oid`. Verify the row is backfilled with the OID.
6. **Gate demo login for production** — The email/password login path (`POST /api/auth/login`) and the demo user buttons on `LoginPage.tsx` should be hidden or disabled when `NODE_ENV=production`, since Entra will be the sole auth method.
7. **Add integration tests** — `POST /api/auth/entra` is explicitly excluded from route-level tests until the flow is validated. Once working, add tests that mock the JWT verification layer.

---

## 2. Authentication Hardening — 🟢 Mostly Complete

Security-relevant items addressed before production deployment:

- [x] **SESSION_SECRET fails loudly in production** — `server/src/index.ts` now throws at startup if `SESSION_SECRET` env var is missing when `NODE_ENV=production`. Dev mode uses a fallback.
- [x] **Demo credentials gated behind DEV** — `src/pages/LoginPage.tsx` wraps the email/password form, demo user buttons, and pre-filled credentials in `import.meta.env.DEV`. Production builds show only the Microsoft SSO button.
- [x] **Rate limiting** — `express-rate-limit` added to `/api/auth` endpoints (20 requests per 15 minutes per IP).
- [ ] **Password reset flow** — Not implemented. May not be needed if Entra ID becomes the sole authentication method; decide based on final auth strategy.
- [x] **CORS in production** — `CORS_ORIGIN` env var is explicitly handled: when set, CORS middleware applies; when omitted, same-origin policy applies (correct for single-container deploy). Intent documented with inline comment.

---

## 3. CLAUDE.md — 🟢 Complete

Full rewrite completed. Now accurately documents:

- [x] Full-stack architecture (React SPA + Express API + PostgreSQL)
- [x] Complete project structure including `server/`, `db/migrations/`, `Dockerfile`, `docker-compose.yml`, `.github/`, `docs/`
- [x] Technology stack for both frontend and server (Express 4, pg, bcryptjs, express-session, Flyway, Docker, etc.)
- [x] `@faker-js/faker` reference removed
- [x] Two dependency trees documented (root `package.json` + `server/package.json`)
- [x] Accurate `npm ci` / `npm ci --prefix server` instructions
- [x] Database migrations workflow
- [x] API routes table, environment variables, auth flows, testing conventions, CI pipeline

---

## 4. Test Coverage — 🟢 Complete (this work item)

All items below are addressed by the current work item:

- [x] Fix 2 failing server auth middleware tests (`server/src/middleware/__tests__/auth.test.ts`)
- [x] Add `requireSuperAdmin` test coverage
- [x] Add route-level tests for all 6 server route files (activity, journals, participations, sessions, users, weighIns)
- [x] Add frontend component tests (Button, Badge, Input, Card, Avatar, ToggleSwitch, LoadingSpinner, ErrorBanner, ConfettiBurst, ProtectedRoute)
- [x] Enforce 70% server coverage threshold in `server/vitest.config.ts`
- [x] Server coverage: 90% statements, 81% branches, 98% functions, 94% lines

### Current test counts

| Suite | Test files | Tests | Status |
|---|---|---|---|
| Server | 10 | 83 | ✅ All pass |
| Frontend | 13 | 106 | ✅ All pass |

### Not covered (out of scope)

- `server/src/routes/auth.ts` — Excluded until Entra ID is validated (see §1)
- `server/src/index.ts`, `server/src/db.ts`, `server/src/seed.ts` — Entry points / infra excluded from coverage threshold

---

## 5. CI/CD Pipeline — 🟢 Complete (this work item)

- [x] GitHub Actions workflow created (`.github/workflows/ci.yml`)
- [x] Runs frontend tests (`npm test`)
- [x] Runs server tests with coverage enforcement (`npm run test:coverage --prefix server`)
- [x] Fails build if server coverage drops below 70%
- [ ] **Future:** Docker image build step
- [ ] **Future:** Deployment to staging/production environment

---

## 6. Production Deployment Readiness — 🔴 Not Started

None of these items are blockers for completing the application, but all are required before real participants can use it:

- [ ] **PostgreSQL instance** — Currently Docker dev DB only. Need a managed PostgreSQL instance (Azure Database for PostgreSQL, RDS, etc.)
- [x] **Environment variable documentation** — `.env.example` created listing all required variables. `SESSION_SECRET` enforced at startup in production.
- [ ] **Secret management** — All secrets (`SESSION_SECRET`, `DB_PASSWORD`, Entra IDs) must be configured via secure environment variable management in production (not `.env` files)
- [ ] **TLS/HTTPS** — Application serves HTTP only. Need a reverse proxy (nginx, Azure App Service, etc.) with TLS termination
- [ ] **Domain and DNS** — No domain configured
- [x] **Health check endpoint** — `GET /api/health` probes DB connectivity, returns `{ status: 'ok' }` or 503 `{ status: 'unhealthy' }`. No auth required.
- [ ] **Monitoring/logging** — No application monitoring, error tracking, or structured logging. Consider adding error reporting (Sentry, Application Insights) and request logging
- [ ] **Backup strategy** — No database backup configuration

---

## 7. Minor Enhancements — 🟡 Optional

Low-priority items discovered during code audit that are not blockers:

- [ ] **Input validation library** — All routes use ad-hoc `if (!field)` checks. Consider Zod or Joi for consistent validation and better error messages.
- [ ] **Error handling consistency** — `asyncHandler` wraps route handlers, but the global error handler (`errorHandler.ts`) only returns a generic 500. Consider structured error responses.
- [ ] **Pagination** — No routes support pagination. Activity feed is capped at 40 rows; all other list endpoints return unbounded results.
- [ ] **TanStack Query integration** — `@tanstack/react-query` is installed and provider is mounted, but no hooks are used. Frontend still uses zustand + manual fetch for all data loading.
