<div align="center">
  <h1>BarangayOS</h1>
  <p align="center">
    <strong>A modern document and records management system for Philippine Barangay LGUs</strong>
  </p>
  <p align="center">
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB" alt="React 19"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6-3178C6" alt="TypeScript 6"></a>
    <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8-646CFF" alt="Vite 8"></a>
    <a href="https://pocketbase.io/"><img src="https://img.shields.io/badge/PocketBase-0.39-B8DBE4" alt="PocketBase"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4" alt="Tailwind CSS 4"></a>
    <br>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-compose-2496ED" alt="Docker"></a>
    <a href="https://github.com/YOUR_USER/barangayos/actions"><img src="https://img.shields.io/github/actions/workflow/status/YOUR_USER/barangayos/ci.yml?branch=main&label=CI" alt="CI"></a>
    <a href="https://github.com/YOUR_USER/barangayos/issues"><img src="https://img.shields.io/github/issues/YOUR_USER/barangayos" alt="Issues"></a>
  </p>

  <br>
  <p>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
    <a href="CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa" alt="Contributor Covenant"></a>
  </p>
</div>

---

## About

BarangayOS is a comprehensive, offline-capable web application purpose-built for **Philippine Barangay Local Government Units (LGUs)**. It replaces paper-based record keeping with a modern, digital system that works even when the internet is unreliable.

**The problem:** Most barangay offices still rely on paper records, standalone Excel files, or expensive proprietary software. Internet connectivity in many areas is intermittent. BarangayOS solves this by providing a free, open-source system that works offline and syncs when connectivity is available.

### Who is this for?

- **Barangay Secretaries & Staff** — Manage residents, documents, blotter cases, and daily operations
- **Barangay Captains & Councilors** — Access reports, approve documents, track finances
- **IT Administrators** — Deploy, configure, and maintain the system
- **Developers** — Contribute features, fix bugs, customize for local needs

## Features

### Records & Document Management

| Feature | Description |
|---------|-------------|
| **Resident Management** | Complete resident profiles with demographics, tags (voter, senior, PWD, 4Ps, deceased), and family associations |
| **Household Management** | Track families, household heads, and resident groupings |
| **Document Request & Release** | End-to-end document lifecycle — request, processing, and release tracking |
| **Blotter / Incident Records** | Complaint tracking with hearing, settlement, and escalation workflow |

### Governance & Operations

| Feature | Description |
|---------|-------------|
| **Barangay Assets** | Inventory management with condition and status tracking |
| **Calendar & Agenda** | Meeting scheduling, agenda items, session management, and resolution tracking |
| **Visitor Log** | Digital visitor check-in/out with timestamps |
| **Activity Logs** | Comprehensive audit trail of all system actions |

### Finance Module

| Feature | Description |
|---------|-------------|
| **Budget Appropriations** | Track appropriations by expense class (PS/MOOE/CO) |
| **Fund Sources** | Manage fund sources with statutory rules (20% DF, SK, etc.) |
| **Revenue Tracking** | Record and track revenue collections linked to income accounts |
| **Disbursements & Obligations** | Full obligation and disbursement workflow |
| **Finance Audit Trail** | Dedicated audit log for every financial transaction with user attribution |

### Platform Capabilities

| Feature | Description |
|---------|-------------|
| **Offline Mode** | IndexedDB write queue — queues data when connection drops, auto-flushes on reconnect |
| **Role-Based Access** | Admin, Staff, and Viewer roles with granular, server-enforced permissions |
| **Dark Mode** | Light/dark theme toggle with automatic system preference detection |
| **Cloudflare Tunnel** | Secure public access without opening firewall ports |
| **Database Backup** | Automatic backups to S3-compatible storage (Cloudflare R2) via admin UI |
| **PWA Ready** | Mobile-friendly interface with service worker support |
| **Reports Dashboard** | Aggregated statistics and data visualization with interactive charts |
| **Smart URL Resolution** | Automatic API URL selection based on network environment |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | [React 19](https://react.dev/), [TypeScript 6](https://www.typescriptlang.org/), [Vite 8](https://vite.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Backend** | [PocketBase](https://pocketbase.io/) 0.39 (Go + embedded SQLite, REST API) |
| **Auth** | Email/password with role-based authorization (admin/staff/viewer) |
| **Data Tables** | [@tanstack/react-table](https://tanstack.com/table) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Offline** | IndexedDB via [`idb`](https://github.com/jakearchibald/idb) library |
| **Testing** | [Vitest 3](https://vitest.dev/) (unit), [Playwright](https://playwright.dev/) (E2E) |
| **Linting** | [oxlint](https://oxc.rs/) with React + TypeScript plugins |
| **Infrastructure** | [Docker](https://www.docker.com/), [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/), [GitHub Actions](https://github.com/features/actions) |

## Quick Start

### Prerequisites

- Node.js 20+ (required by Vite 8)
- npm 10+
- Git
- PocketBase binary ([download](https://pocketbase.io/docs/))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USER/barangayos.git
cd barangayos

# 2. Install frontend dependencies
cd frontend && npm install

# 3. Copy the example environment file
cp .env.local.example .env.local

# 4. Start PocketBase for local testing
#    (Windows)
.\backend\pocketbase-service.exe serve --http=127.0.0.1:8090 --dir=pb_data --migrationsDir=backend/pb_migrations
#    (Linux / macOS)
# ./pocketbase serve --http=127.0.0.1:8090 --dir=pb_data --migrationsDir=backend/pb_migrations

# 5. Start the Vite dev server (separate terminal)
cd frontend && npm run dev
```

The app runs at **http://localhost:8080** and PocketBase Admin UI at **http://localhost:8090/_/**.

See the [Development Guide](docs/DEVELOPMENT.md) for detailed setup instructions.

### Quick Start with Docker

```bash
# Build the frontend
cd frontend && npm run build && cd ..

# Start the stack (PocketBase + nginx)
cd backend
docker compose up -d --build
```

> **Note:** The `pocketbase-service.exe` binary in `backend/` is for local Windows testing only and is gitignored. In production, PocketBase runs inside a Docker container.

## Project Structure

```
barangayos/
├── frontend/                  # React SPA
│   ├── src/                   # Application source
│   │   ├── api/               # 22 API client modules (one per PocketBase collection)
│   │   ├── auth/              # Authentication, session, route guards
│   │   ├── components/ui/     # 30+ shared UI components
│   │   ├── features/          # 12 domain feature modules
│   │   ├── lib/               # Utilities, helpers, config
│   │   ├── offline/           # IndexedDB queue, sync manager, indicator
│   │   ├── pages/             # Page-level components
│   │   └── routes/            # Route definitions
│   ├── public/                # Static assets
│   ├── e2e/                   # Playwright E2E tests
│   ├── Dockerfile             # Multi-stage production build
│   ├── nginx.conf             # Nginx config with API proxy
│   └── package.json           # Frontend dependencies
├── backend/                   # PocketBase backend
│   ├── pb_migrations/         # Schema + RBAC migrations
│   ├── Dockerfile             # Alpine + PocketBase binary
│   ├── docker-compose.yml     # Production stack (nginx + PocketBase)
│   └── docker-compose.dev.yml # Development compose (PocketBase only)
├── scripts/                   # Deploy and utility scripts
│   ├── deploy.ps1             # Build frontend
│   ├── deploy-prod.ps1        # Production deploy from GitHub artifact
│   ├── e2e-server.mjs         # E2E test server orchestrator
│   ├── export-data.sh         # Export PocketBase data via API
│   └── healthcheck.sh         # PocketBase health check
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # System design and data flow
│   ├── DEVELOPMENT.md         # Local setup and coding standards
│   ├── DEPLOYMENT.md          # Production deployment guide
│   ├── CONTRIBUTING.md        # How to contribute
│   └── SECURITY.md            # Security policy
├── .github/                   # GitHub community health files
│   ├── workflows/ci.yml       # CI pipeline
│   ├── ISSUE_TEMPLATE/        # Bug report and feature request templates
│   └── PULL_REQUEST_TEMPLATE.md
├── CHANGELOG.md               # Version history
├── CODE_OF_CONDUCT.md         # Contributor Covenant
└── LICENSE                    # MIT License
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Guide](docs/ARCHITECTURE.md) | System design, data flow, smart URL resolution, offline architecture |
| [Development Guide](docs/DEVELOPMENT.md) | Local setup, coding standards, testing, building |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment with Docker, Cloudflare Tunnel, and more |
| [Contributing Guide](docs/CONTRIBUTING.md) | How to contribute, code style, PR process |
| [Security Policy](docs/SECURITY.md) | Reporting vulnerabilities, security best practices |
| [Changelog](CHANGELOG.md) | Version history and release notes |

## Testing

```bash
# Unit tests (Vitest)
cd frontend && npm run test

# With coverage
npm run test:coverage

# E2E tests (Playwright)
npx playwright test

# CI verification (what runs in GitHub Actions)
npm run lint
npx tsc -b
npm run test
npm run build
```

## Roadmap

- [x] Core record management (residents, households, documents)
- [x] Blotter / incident tracking with case workflow
- [x] Finance module (appropriations, revenues, disbursements)
- [x] Offline mode with automatic sync
- [x] Role-based access control
- [x] Docker deployment with Cloudflare Tunnel
- [ ] API documentation (OpenAPI / Swagger)
- [ ] Mobile app (wrapping the web app)
- [ ] Multi-barangay / centralized deployment
- [ ] SMS notifications for document releases
- [ ] Electronic signatures
- [ ] Integration with Philippine government systems (PSA, DILG)

> Suggest and vote on features via [GitHub Issues](https://github.com/YOUR_USER/barangayos/issues/new?template=feature_request.md).

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

- [Report a bug](https://github.com/YOUR_USER/barangayos/issues/new?template=bug_report.md)
- [Request a feature](https://github.com/YOUR_USER/barangayos/issues/new?template=feature_request.md)
- Read the [Code of Conduct](CODE_OF_CONDUCT.md)

## License

This project is [MIT](LICENSE) licensed — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for every Barangay in the Philippines
- [PocketBase](https://pocketbase.io/) — The lightweight backend that makes this possible
- [Cloudflare](https://www.cloudflare.com/) — For their generous free-tier tunnel and R2 services
- All barangay secretaries and staff who provided invaluable domain expertise

---

<p align="center">
  <sub>Made for every Barangay in the Philippines</sub>
</p>
