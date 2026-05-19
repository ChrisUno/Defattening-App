# CLAUDE.md — Defattening App

This file provides guidance to Claude Code (claude.ai/code) when working with this project.

## Project Overview

**Defattening** — a full-stack weight-loss challenge tracker for workplace teams. Participants join time-boxed sessions, log weekly weigh-ins, and compete on percentage lost (actual weights stay private). Features include leaderboards, streaks, journals, activity feeds, and end-of-season awards.

## Architecture

```
Browser (React SPA)  ──/api──▶  Express API server  ──SQL──▶  PostgreSQL 16
        │                              │
   Vite dev proxy              express-session
   (port 5173 → 3001)         (connect-pg-simple)
```

- **Frontend**: React 19 SPA served by Vite in development, served as static files by Express in production.
- **Server**: Express 4 REST API on port 3001. Raw SQL via `pg` (no ORM).
- **Database**: PostgreSQL 16 (Docker). Schema managed by Flyway versioned migrations.
- **Auth**: Microsoft Entra ID (SSO) as primary auth. Email/password login exists for dev only.
- **Deploy**: Multi-stage Dockerfile builds frontend + server into a single container.

## Technology Stack

### Frontend

| Package | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 6 | Build tool + HMR + dev proxy |
| TypeScript 5.7 | Type safety |
| Tailwind CSS 4 | Utility-first styling |
| zustand 5 | Client state management |
| @tanstack/react-query 5 | Async data management (provider mounted, not yet used for queries) |
| framer-motion 11 | Animations |
| recharts 2 | Charts |
| lucide-react | Icons |
| react-router 7 | Client-side routing |
| @azure/msal-browser + @azure/msal-react | Entra ID SSO |
| date-fns | Date formatting |
| clsx | Conditional classnames |

### Server

| Package | Purpose |
|---|---|
| Express 4 | HTTP framework |
| pg 8 | PostgreSQL driver (raw parameterized queries) |
| express-session + connect-pg-simple | Session management (PostgreSQL-backed, httpOnly cookies) |
| bcryptjs | Password hashing (10 salt rounds) |
| jsonwebtoken + jwks-rsa | Entra ID JWT verification via JWKS |
| express-rate-limit | Rate limiting on auth endpoints |
| tsx | TypeScript execution (dev + production) |

### Database & Migrations

| Tool | Detail |
|---|---|
| PostgreSQL 16 | `postgres:16-alpine` Docker image |
| Flyway 11 | Schema migrations in `db/migrations/` as versioned SQL (`V1__`, `V2__`, …) |

### Infrastructure

| Tool | Detail |
|---|---|
| Docker | Multi-stage build: Node 22 Alpine |
| docker-compose | Services: `postgres`, `flyway` (migrate profile), `app` (deploy profile) |
| GitHub Actions | CI pipeline: runs both test suites, enforces 70% server coverage |

## Project Structure

```
defattening/
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI primitives (Button, Card, Input, Badge, etc.)
│   │   └── __tests__/            # Component tests
│   ├── pages/                    # Page components (Dashboard, Leaderboard, Journal, etc.)
│   ├── store/                    # Zustand stores (authStore, dataStore, uiStore)
│   ├── lib/                      # Utilities (api client, stats, BMI, MSAL config, etc.)
│   ├── App.tsx                   # Root component + routes
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Tailwind theme + global styles
│   └── test-setup.ts             # Vitest setup for frontend
├── server/                       # Express API server
│   ├── src/
│   │   ├── routes/               # Route handlers (auth, users, sessions, participations, weighIns, journals, activity)
│   │   │   └── __tests__/        # Route tests (supertest)
│   │   ├── middleware/            # Auth middleware (requireAuth, requireAdmin, requireSuperAdmin)
│   │   │   └── __tests__/        # Middleware tests
│   │   ├── lib/                  # Server utilities (stats calculations)
│   │   │   └── __tests__/        # Lib tests
│   │   ├── index.ts              # Server entry point
│   │   ├── db.ts                 # PostgreSQL pool config
│   │   └── seed.ts               # Dev seed data script
│   ├── package.json              # Server dependencies (separate from frontend)
│   └── vitest.config.ts          # Server test config (70% coverage threshold)
├── db/
│   └── migrations/               # Flyway SQL migrations (V1__ through V7__)
├── .github/
│   └── workflows/ci.yml          # CI pipeline
├── docs/
│   └── completion-checklist.md   # Outstanding work tracker
├── Dockerfile                    # Multi-stage production build
├── docker-compose.yml            # Dev DB + migration + deploy profiles
├── .env.example                  # Environment variable reference
├── vite.config.ts                # Vite config (dev proxy, Tailwind plugin)
├── vitest.config.ts              # Frontend test config (jsdom)
├── package.json                  # Frontend dependencies
└── CLAUDE.md                     # This file
```

## Development Workflow

### Prerequisites

- Node.js 22+
- Docker + Docker Compose (for PostgreSQL)

### Starting the dev environment

```bash
# First-time setup — copy env template (DB defaults match docker-compose, no edits needed for local dev)
cp .env.example .env

# Start PostgreSQL
docker compose up -d postgres

# Run migrations
docker compose --profile migrate up

# Seed dev data (optional — creates demo users + sessions)
npm run seed --prefix server

# Start API server (port 3001)
npm run dev --prefix server

# Start frontend dev server (port 5173, proxies /api → 3001)
npm run dev
```

### Running tests

```bash
# Frontend tests (jsdom, 106 tests)
npm test

# Server tests (node, 83 tests)
npm test --prefix server

# Server tests with coverage (enforces 70% threshold)
npm run test:coverage --prefix server
```

### Database migrations

All schema changes go in `db/migrations/` as versioned SQL files:

```bash
# Create a new migration
touch db/migrations/V8__describe_change.sql

# Apply migrations
docker compose --profile migrate up
```

### Installing dependencies

Two separate dependency trees — never mix them:

```bash
# Frontend
npm ci                     # or npm install <pkg>

# Server
npm ci --prefix server     # or cd server && npm install <pkg>
```

## API Routes

All routes are mounted under `/api`. Auth middleware (`requireAuth`) is applied to all routes except login/entra endpoints and the health check.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Health check (DB connectivity probe) |
| `POST` | `/api/auth/login` | None | Email/password login (dev only) |
| `POST` | `/api/auth/entra` | None | Entra ID SSO login |
| `GET` | `/api/auth/me` | Session | Current user info |
| `POST` | `/api/auth/logout` | Session | Destroy session |
| `GET` | `/api/users` | Admin | List all users |
| `POST` | `/api/users` | Admin | Create user |
| `GET` | `/api/sessions` | Session | List sessions |
| `POST` | `/api/sessions` | Admin | Create session |
| `PUT` | `/api/sessions/:id` | Admin | Update session |
| `DELETE` | `/api/sessions/:id` | Admin | Delete session |
| `GET` | `/api/participations` | Session | List participations |
| `POST` | `/api/participations` | Session | Join session |
| `POST` | `/api/participations/admin-join` | Admin | Join user to session |
| `DELETE` | `/api/participations/:id` | Admin | Remove participation |
| `GET` | `/api/weigh-ins` | Session | List weigh-ins |
| `POST` | `/api/weigh-ins` | Session | Submit weigh-in |
| `GET` | `/api/journals` | Session | List journal entries |
| `POST` | `/api/journals` | Session | Create journal entry |
| `DELETE` | `/api/journals/:id` | Session | Delete own journal entry |
| `GET` | `/api/activity` | Session | Activity feed (capped at 40) |

Rate limiting: `/api/auth` endpoints are limited to 20 requests per 15 minutes per IP.

## Environment Variables

See `.env.example` for the complete reference. Key variables:

| Variable | Required | Description |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Yes | PostgreSQL connection |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | `development` or `production` |
| `SESSION_SECRET` | **Prod only** | Session signing key. Server crashes at startup if missing in production. |
| `CORS_ORIGIN` | No | Production CORS origin. Omit for same-origin (single-container deploy). |
| `ENTRA_TENANT_ID` | Yes | Azure AD tenant ID (server-side JWT validation) |
| `ENTRA_API_CLIENT_ID` | Yes | Azure AD API app client ID |
| `VITE_ENTRA_TENANT_ID` | Build-time | Baked into frontend at `vite build` |
| `VITE_ENTRA_CLIENT_ID` | Build-time | SPA client ID for MSAL |
| `VITE_ENTRA_API_SCOPE` | Build-time | API scope for access token requests |

## Authentication

Two auth paths exist:

1. **Microsoft Entra ID (production)** — MSAL popup → access token → `POST /api/auth/entra` → server verifies JWT via JWKS → session established.
2. **Email/password (dev only)** — `POST /api/auth/login` → bcrypt comparison → session. The login form and demo user buttons are gated behind `import.meta.env.DEV` and tree-shaken from production builds.

Sessions use `express-session` with a PostgreSQL store (`http_sessions` table). Cookies are `httpOnly`, `sameSite: lax`, `secure` in production, 7-day max age.

Middleware:
- `requireAuth` — checks `req.session.userId` exists
- `requireAdmin` — checks session + `role === 'admin'`
- `requireSuperAdmin` — checks session + `role === 'super_admin'`

## State Management

- **zustand** for client-side shared state (`authStore`, `dataStore`, `uiStore`)
- **@tanstack/react-query** provider is mounted but not yet used for queries
- **useState** for simple local component state only
- Server is the source of truth — `dataStore.hydrate()` fetches all data from the API

The centralized API client (`src/lib/api.ts`) sends `credentials: 'include'` on every fetch for session cookies.

## Styling with Tailwind CSS

This project uses Tailwind CSS 4 with a custom theme defined in `src/index.css`. Key conventions:

- Use utility classes for layout and spacing
- Use the app's custom color palette — not generic Tailwind colors

Custom palette:
- **`tangerine-*`** — Primary blue accent (50–700)
- **`grape-*`** — Secondary indigo (50–700)
- **`ink-*`** — Text/foreground (900–300)
- **`cream-*`** — Background/surface (50–200)
- **`lime-*`** — Success green (300–600)
- **`rose-bright`** — Error/danger red

Custom fonts:
- **`font-display`** — Fraunces (headings)
- **`font-sans`** — Inter (body)

Common patterns:
```jsx
// Page container — every page must wrap content with horizontal padding
<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">

// Card container — always include internal padding
<div className="bg-cream-50 rounded-lg shadow-md p-6">

// Primary button
<button className="px-4 py-2 bg-tangerine-500 text-white rounded hover:bg-tangerine-600 transition-colors">

// Responsive grid — always include gap
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**IMPORTANT**: Content must never touch the viewport edges. Always wrap page content in a container with horizontal padding (`px-6` minimum). Cards and sections must have internal padding (`p-6` minimum).

Dark mode is supported via a `.dark` class toggle using `@custom-variant dark`.

## Component Guidelines

1. Create components in `src/components/` (reusable UI in `src/components/ui/`)
2. Use TypeScript interfaces for props
3. Follow React hooks best practices
4. Use Tailwind CSS for styling with the custom palette

Example component structure:
```typescript
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

const MyComponent = ({ title, onAction }: MyComponentProps) => {
  return (
    <div className="p-4 bg-cream-50 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-tangerine-500 text-white rounded hover:bg-tangerine-600"
        >
          Action
        </button>
      )}
    </div>
  );
};

export default MyComponent;
```

## Comment Guidelines

**NO COMMENTS** in production code unless absolutely critical. Write self-documenting code with descriptive names.

### Acceptable Comments (Very Rare):
- **Complex algorithm explanations**: Only when the logic cannot be clarified through better function/variable names
- **Temporary workarounds**: With issue references (e.g., `// TODO: Fix when API supports X (ticket #123)`)
- **Legal/license headers**: If required by company policy
- **Critical security warnings**: Where security implications aren't obvious from code

### NEVER Add Comments For:
- **Obvious action descriptions**: `// Set loading state`, `// Call API`, `// Update component`
- **Component section markers**: `// State`, `// Effects`, `// Event handlers`
- **JSDoc for internal functions**: Only for public library APIs
- **What the code does**: Comments that repeat what the code clearly shows
- **Variable assignments**: `// Store user data`, `// Initialize state`

### Write Self-Documenting Code Instead:
```typescript
const loadCourses = async () => {
  setLoading(true);
  const courses = await getCourses();
  setCourses(courses);
  setLoading(false);
};
```

## TypeScript Best Practices

- Define interfaces for all props and state
- Use type inference where possible
- Avoid using `any` type
- Export types from a central `types.ts` file for reuse

## Testing Conventions

Both suites use **Vitest**. Frontend uses `jsdom` environment; server uses `node`.

### Frontend tests
- Located alongside source in `__tests__/` directories
- Use `@testing-library/react` + `@testing-library/user-event`
- Component tests mock MSAL via `@azure/msal-react` provider
- Config: `vitest.config.ts` (root)

### Server tests
- Located in `src/**/__tests__/*.test.ts`
- Use `supertest` for HTTP-level route testing
- Mock `pg.Pool` and middleware — no real database
- **70% coverage threshold** enforced (statements, branches, functions, lines)
- Config: `server/vitest.config.ts`
- Coverage excludes: `index.ts`, `db.ts`, `seed.ts`, `routes/auth.ts` (Entra-blocked)

### CI
GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:
1. `npm ci` + `npm ci --prefix server`
2. Frontend tests
3. Server tests with coverage enforcement

## Important Notes

- **No Backwards Compatibility Needed**: This application has not yet been released to production, so backwards compatibility is not a concern.
- **Entra ID is incomplete**: The SSO flow is implemented but not validated with real Azure AD credentials. See `docs/completion-checklist.md` for details.
- **Two package.json files**: Root is frontend, `server/package.json` is backend. Never mix dependencies between them.
- **Row mappers**: Every server route uses a mapper function (e.g., `toUser`, `toSession`) to convert snake_case DB columns to camelCase API responses. Follow this pattern for new routes.
