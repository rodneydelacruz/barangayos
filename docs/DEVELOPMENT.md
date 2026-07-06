# Development Guide

## Prerequisites

- **Node.js** 20+ (required for Vite 8)
- **npm** 10+
- **PocketBase** binary (download from [pocketbase.io](https://pocketbase.io))
- **Git**

## Initial Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USER/barangayos.git
cd barangayos

# Install JavaScript dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

The default `.env.local` should look like:

```env
VITE_API_URL=http://localhost:8090
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

## Running Locally

### Terminal 1: Start PocketBase

```bash
# From the project root
./pocketbase serve --http=127.0.0.1:8090 --dir=pb_data --migrationsDir=pocketbase/pb_migrations
```

This starts PocketBase on port 8090 with:
- SQLite database in `pb_data/`
- All schema migrations applied automatically
- Admin UI at `http://127.0.0.1:8090/_/`
- REST API at `http://127.0.0.1:8090/api/`

### Terminal 2: Start Vite dev server

```bash
npm run dev
```

The Vite dev server runs on port **8080** and the app is available at `http://localhost:8080`.

> PocketBase serves both the static files AND the API. In development, Vite proxies API calls to PocketBase on port 8090 via the configured `VITE_API_URL`.

### Setting up the admin account

1. Visit `http://localhost:8090/_/`
2. Create the initial admin account
3. Create user accounts in the **Users** collection with appropriate roles (admin/staff/viewer)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 8080 |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run oxlint on the codebase |

## Project Structure

```
src/
  api/               API client modules (one per collection)
    client.ts        PocketBase singleton client
    errorHandler.ts  Centralized error handling
    residents.ts     Resident CRUD operations
    documents.ts     Document request operations
    financeAudit.ts  Finance audit trail logging
    appropriations.ts Budget appropriations
    fundSources.ts   Fund sources
    revenues.ts      Revenue tracking
    disbursements.ts Disbursement records
    obligations.ts   Obligation requests
    incomeAccounts.ts Income accounts
    ...              One file per collection
  auth/              Authentication and authorization
    session.ts       Login/logout, role checking, token management
    guards.tsx       Route protection components
    LoginPage.tsx    Login page component
  components/        Shared UI components
    ui/              shadcn/ui primitives (button, input, card, etc.)
    Layout.tsx       App layout with sidebar
    Sidebar.tsx      Sidebar navigation
    ThemeToggle.tsx  Dark/light mode toggle
    ProtectedRoute.tsx  Auth + role route guard
  features/          Domain feature modules
    records/         Barangay records management
    residents/       Resident profiles
    households/      Household management
    documents/       Document requests and release
    logs/            Activity and visitor logs
    reports/         Reports dashboard
    assets/          Asset inventory
    calendar/        Event calendar
    agenda/          Meeting agenda
    finance/         Finance module (budget, revenues, disbursements, audit)
    settings/        System settings
  lib/               Shared utilities
    apiConfig.ts     API URL resolution logic
    export.ts        Data export (CSV, JSON, SQL)
    health.ts        API health check hook
    theme.tsx        Theme provider context
    utils.ts         Date formatting, cn() helper
    statusStyles.ts  Status badge color mappings
  offline/           Offline support
    queue.ts         IndexedDB queue for offline operations
    syncManager.ts   Queue flush and sync logic
    OfflineIndicator.tsx  Offline status UI
  pages/             Page-level components
    Dashboard.tsx    Main dashboard page
    Dashboard*.tsx   Dashboard sub-components
  routes/            Route definitions
    index.tsx        All route declarations with role guards
pocketbase/
  pb_hooks/          PocketBase JS hooks (server-side scripting)
    rate_limit.pb.js       Rate limiting placeholder
    audit_log.pb.js        Audit log placeholder
  pb_migrations/     Database schema + RBAC migrations
    001_create_users_role.js
    002_create_records.js
    ...
  pb_schema.json     Exported collection schema (reference only)
scripts/             Utility scripts
  deploy.ps1         Build + copy to pb_public
  deploy-prod.ps1    Production deploy from GitHub artifact
  export-data.sh     Database export script
  healthcheck.sh     Server health check
docs/                Documentation
  ARCHITECTURE.md    System architecture
  DEVELOPMENT.md     This file
  DEPLOYMENT.md      Production deployment
  CONTRIBUTING.md    Contribution guidelines
  SECURITY.md        Security policy
```

## Coding Standards

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig)
- `noUnusedLocals` and `noUnusedParameters` are enabled
- Prefer explicit return types on function declarations
- Use `import type` for type-only imports

### React

- Functional components with hooks (no class components)
- Props interfaces defined with `interface`, not `type`
- File naming: PascalCase for components, camelCase for utilities
- One component per file (except small related utilities)

### CSS / Tailwind

- Tailwind CSS v4 with `@import "tailwindcss"` syntax
- Custom theme colors defined in `src/index.css` via `@theme` directive
- Motion utilities (`motion-fade-in`, `motion-slide-up`, etc.) for animations
- Dark mode via `.dark` class on `<html>` element (handled by `ThemeProvider`)

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files (utilities) | camelCase | `apiConfig.ts`, `utils.ts` |
| Files (components) | PascalCase | `LoginPage.tsx`, `Sidebar.tsx` |
| Functions | camelCase | `getApiUrl()`, `formatDate()` |
| Components | PascalCase | `ThemeProvider`, `ProtectedRoute` |
| Types/Interfaces | PascalCase | `AuthUser`, `HealthStatus` |
| Environment variables | UPPER_SNAKE | `VITE_API_URL`, `VITE_LOCAL_API_URL` |

## Testing

Tests use Vitest with jsdom environment. Test files should be placed alongside the code they test with `.test.ts` or `.test.tsx` extension.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Writing tests

```typescript
// Example: src/lib/__tests__/utils.test.ts
describe('formatDate', () => {
  it('returns formatted date string', () => {
    expect(formatDate('2024-01-15 10:00:00')).toContain('Jan')
  })
})
```

> Note: Vitest is configured with `globals: true` — `describe`, `it`, `expect` are globally available without imports.

## Linting

```bash
npm run lint
```

Uses oxlint with React and TypeScript plugins. Configuration is in `.oxlintrc.json`.

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. To deploy, copy the contents to PocketBase's `pb_public/` directory:

```bash
Copy-Item -Path "dist\*" -Destination "pb_public\" -Recurse -Force
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.
