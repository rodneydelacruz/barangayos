# Development Guide

## Prerequisites

- **Node.js** 20+ (required for Vite 8)
- **npm** 10+
- **PocketBase** binary — download from [pocketbase.io/docs](https://pocketbase.io/docs/)
- **Git**
- **Docker Desktop** (optional, for production simulation)

## Initial Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USER/barangayos.git
cd barangayos

# Install JavaScript dependencies
cd frontend && npm install

# Set up environment variables
cp .env.local.example frontend/.env.local
```

### Environment Variables

Create `frontend/.env.local` with the following:

```env
VITE_API_URL=http://localhost:8090
VITE_LOCAL_API_URL=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes** | — | Primary API URL (PocketBase). In dev: `http://localhost:8090`. In production: the Cloudflare Tunnel URL. |
| `VITE_LOCAL_API_URL` | No | — | LAN IP for local network access in production (e.g., `http://192.168.1.100:8080`). Leave empty in dev. |
| `VITE_CLOUDINARY_CLOUD_NAME` | No | — | Cloudinary cloud name for image uploads. Leave empty if not using image upload. |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | No | — | Cloudinary unsigned upload preset. Leave empty if not using image upload. |

> **Note:** `*.local` files are gitignored and never committed.

## Running Locally

### Terminal 1: Start PocketBase

```bash
# From the project root

# Windows
.\backend\pocketbase-service.exe serve --http=127.0.0.1:8090 --dir=pb_data --migrationsDir=backend/pb_migrations

# Linux / macOS (after downloading the PocketBase binary)
# ./pocketbase serve --http=127.0.0.1:8090 --dir=pb_data --migrationsDir=backend/pb_migrations
```

This starts PocketBase on port 8090 with:
- SQLite database in `backend/pb_data/`
- All schema migrations applied automatically
- Admin UI at `http://127.0.0.1:8090/_/`
- REST API at `http://127.0.0.1:8090/api/`

### Terminal 2: Start Vite dev server

```bash
cd frontend && npm run dev
```

The Vite dev server runs on port **8080** and the app is available at `http://localhost:8080`.

### Setting up the admin account

1. Visit `http://localhost:8090/_/`
2. Create the initial admin account
3. Navigate to the **Users** collection in the PocketBase admin UI
4. Create user accounts with appropriate roles (admin/staff/viewer)

> The first user created through the app login will be the first record in the `users` collection. You can also create users directly in the PocketBase Admin UI.

## Running with Docker (Production Simulation)

```bash
# From the project root
cd frontend && npm run build
cd backend

# Set encryption key (generate with: openssl rand -hex 16)
# Windows PowerShell:
$env:PB_ENCRYPTION_KEY = "your-32-char-hex-key"
# Linux / macOS:
# export PB_ENCRYPTION_KEY="your-32-char-hex-key"

# Start the stack
docker compose up -d --build
```

- Frontend: http://localhost:8080
- PocketBase admin: http://localhost:8090/_/

## Available Scripts

All commands run from the `frontend/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 8080 with HMR |
| `npm run build` | TypeScript type check + production build to `frontend/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run all tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with HTML coverage report |
| `npm run lint` | Run oxlint on the entire codebase |

## Project Structure

```
barangayos/
├── frontend/                  # React SPA
│   ├── src/                   # Application source
│   │   ├── api/               # 22 API client modules (one per collection)
│   │   ├── auth/              # Authentication, session, route guards
│   │   ├── components/ui/     # 30+ reusable UI components
│   │   ├── features/          # 12 domain feature modules
│   │   ├── lib/               # Utilities, helpers, config
│   │   ├── offline/           # IndexedDB queue, sync manager, indicator
│   │   ├── pages/             # Page-level components
│   │   └── routes/            # Route definitions
│   ├── e2e/                   # Playwright E2E tests
│   ├── public/                # Static assets
│   ├── nginx.conf             # Nginx config for production container
│   ├── Dockerfile             # Multi-stage Docker build
│   └── package.json           # Frontend dependencies
├── backend/                   # PocketBase backend
│   ├── pb_migrations/         # Database schema + RBAC migrations
│   ├── Dockerfile             # Alpine + PocketBase Linux binary
│   ├── docker-compose.yml     # Production stack configuration
│   └── pocketbase-service.exe # Windows binary (local testing only, gitignored)
├── scripts/                   # Utility scripts
│   ├── deploy.ps1             # Build frontend
│   ├── deploy-prod.ps1        # Production deploy from GitHub artifact
│   ├── e2e-server.mjs         # E2E test server orchestrator
│   ├── export-data.sh         # Export PocketBase data via API
│   └── healthcheck.sh         # PocketBase health check
└── docs/                      # Documentation
    ├── ARCHITECTURE.md        # System design and data flow
    ├── DEVELOPMENT.md         # This guide
    ├── DEPLOYMENT.md          # Production deployment
    ├── CONTRIBUTING.md        # How to contribute
    └── SECURITY.md            # Security policy
```

## Coding Standards

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig)
- `noUnusedLocals` and `noUnusedParameters` are enabled — catch unused code at compile time
- Prefer explicit return types on function declarations for readability
- Use `import type` for type-only imports to avoid bundler issues

### React

- Functional components with hooks only (no class components)
- Props interfaces defined with `interface` keyword, not `type`
- File naming: PascalCase for components, camelCase for utilities and hooks
- One component per file (except small related utility collections)
- Custom hooks prefixed with `use` (e.g., `useApiHealth`)

### CSS / Tailwind

- Tailwind CSS v4 with `@import "tailwindcss"` syntax (no `@tailwind` directives)
- Custom theme colors defined in `src/index.css` via `@theme` directive
- Motion utilities available: `motion-fade-in`, `motion-slide-up`, etc.
- Dark mode via `.dark` class on `<html>` element (managed by `ThemeProvider`)

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files (utilities) | camelCase | `apiConfig.ts`, `formatDate.ts` |
| Files (components) | PascalCase | `LoginPage.tsx`, `Sidebar.tsx` |
| Functions | camelCase | `getApiUrl()`, `formatDate()` |
| Components | PascalCase | `ThemeProvider`, `ProtectedRoute` |
| Types / Interfaces | PascalCase | `AuthUser`, `HealthStatus` |
| Environment variables | UPPER_SNAKE | `VITE_API_URL`, `VITE_LOCAL_API_URL` |

## Testing

Tests use [Vitest 3](https://vitest.dev/) with jsdom environment. Test files should be placed alongside the code they test with `.test.ts` or `.test.tsx` extension.

### Running tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage (outputs to frontend/coverage/)
npm run test:coverage
```

### Writing tests

Test files use Vitest's global API (`describe`, `it`, `expect` are globally available — no imports needed):

```typescript
// Example: src/lib/__tests__/utils.test.ts
import { formatDate } from '../utils'

describe('formatDate', () => {
  it('returns formatted date string for valid input', () => {
    expect(formatDate('2024-01-15 10:00:00')).toContain('Jan')
  })

  it('returns empty string for null input', () => {
    expect(formatDate(null)).toBe('')
  })

  it('handles edge case timestamp', () => {
    expect(formatDate('2024-12-31 23:59:59')).toContain('Dec')
  })
})
```

For React component tests:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders and responds to user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)

    const button = screen.getByRole('button', { name: /submit/i })
    await user.click(button)

    expect(screen.getByText(/success/i)).toBeInTheDocument()
  })
})
```

> **Configuration:** Vitest is configured with `globals: true` in `vitest.config.ts` — global test functions (`describe`, `it`, `expect`) are available without imports. jsdom provides browser-like DOM APIs in the test environment.

### E2E Testing

E2E tests use [Playwright](https://playwright.dev/). Tests are in `frontend/e2e/`:

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps chromium

# Run E2E tests
npx playwright test

# Run with UI mode (interactive)
npx playwright test --ui
```

## Linting

```bash
npm run lint
```

Uses [oxlint](https://oxc.rs/) with React and TypeScript plugins. Configuration is in `.oxlintrc.json` at the project root.

To automatically fix fixable issues:

```bash
npx oxlint --fix
```

## Building for Production

```bash
# 1. TypeScript check + Vite production build
cd frontend && npm run build

# 2. Output is in frontend/dist/ — static files ready for nginx

# 3. Deploy with Docker
cd backend && docker compose up -d --build
```

> See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete production deployment instructions, including Cloudflare Tunnel setup and database backup configuration.

## Troubleshooting

### PocketBase won't start

- **Port already in use**: Make sure nothing else is running on port 8090. Change the port with `--http=127.0.0.1:8091` if needed.
- **Binary not found**: Ensure `pocketbase-service.exe` (Windows) or `pocketbase` (Linux/macOS) exists in `backend/`. Download from [pocketbase.io/docs](https://pocketbase.io/docs/).
- **Migration errors**: Delete `backend/pb_data/` and restart PocketBase to re-run all migrations.

### Vite dev server won't start

- **Node.js version**: Verify you're on Node.js 20+ with `node --version`. Vite 8 requires Node 20+.
- **Missing node_modules**: Run `npm install` in `frontend/`.
- **Port conflict**: Vite defaults to port 8080. Change it in `vite.config.ts` if needed.

### Tests fail

- **No tests found**: Ensure test files end in `.test.ts` or `.test.tsx` and are inside `frontend/src/`.
- **Type errors**: Run `npx tsc -b` to check for TypeScript issues separately.

### Build fails

- **TypeScript errors**: Run `npx tsc -b` to see all type errors. Fix them before building.
- **Out of memory**: Add `--max-old-space-size=4096` to the build command: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

### Login always fails

- PocketBase must be running with migrations applied. Check the PocketBase terminal for errors.
- Visit `http://localhost:8090/_/` to verify PocketBase is accessible and create the admin account.
- Verify `VITE_API_URL` in `.env.local` matches the PocketBase server address.
