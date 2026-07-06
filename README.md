# BarangayOS

> A comprehensive document and records management system for Philippine Barangay LGUs.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![PocketBase](https://img.shields.io/badge/PocketBase-0.27-B8DBE4)](https://pocketbase.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4)](https://tailwindcss.com/)

A modern, offline-capable web application for managing barangay records, residents, documents, blotter cases, assets, meetings, and more — built specifically for Philippine Local Government Units (LGUs).

## Features

- **Resident Management** — Complete resident profiles with demographics, tags (voter, senior, PWD, 4Ps, deceased), and family associations
- **Household Management** — Track families, household heads, and resident groupings
- **Document Request & Release** — End-to-end document lifecycle (request → processing → release)
- **Blotter / Incident Records** — Complaint tracking with hearing, settlement, and escalation workflow
- **Barangay Assets** — Inventory management with condition tracking
- **Calendar & Agenda** — Meeting scheduling, agenda items, session management
- **Visitor Log** — Digital visitor check-in/out
- **Activity Logs** — Audit trail of system actions
- **Reports Dashboard** — Aggregated statistics and data visualization
- **Finance Module** — Budget appropriations, fund sources, revenue tracking, disbursements, obligations, and income accounts
- **Finance Audit Trail** — Dedicated audit log for all financial transactions with user attribution
- **Offline Mode** — IndexedDB write queue; queues data when connection drops, auto-flushes on reconnect
- **Role-Based Access** — Admin, Staff, and Viewer roles with granular permissions
- **Dark Mode** — Light/dark theme toggle with system preference detection
- **Cloudflare Tunnel** — Secure public access without opening firewall ports
- **Database Backup** — Optional Litestream replication to Cloudflare R2

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Lucide Icons |
| **Backend** | PocketBase (Go + embedded SQLite, REST API) |
| **Auth** | Email/password with role-based authorization |
| **Offline** | IndexedDB via `idb` library |
| **Testing** | Vitest 3, jsdom |
| **Linting** | oxlint |
| **Infrastructure** | Cloudflare Tunnel, Cloudflare R2 (backup), GitHub Actions |

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USER/barangayos.git
cd barangayos

# 2. Install frontend dependencies
npm install

# 3. Copy the example environment file
cp .env.local.example .env.local

# 4. Start PocketBase (download from https://pocketbase.io first)
./pocketbase serve --http=127.0.0.1:8090

# 5. Start the Vite dev server (separate terminal)
npm run dev
```

The app runs at `http://localhost:8080` and proxies API calls to PocketBase at `http://localhost:8090`.

## Project Structure

```
src/
  api/             PocketBase client API modules (one per collection)
  auth/            Authentication, guards, session management
  components/      Shared UI components (shadcn/ui)
  features/        Domain feature modules (records, residents, finance, etc.)
  lib/             Utilities (API config, export, theme, health)
  offline/         IndexedDB queue, sync manager
  pages/           Page-level components (Dashboard)
  routes/          Route definitions
pocketbase/
  pb_hooks/        PocketBase JS hooks (rate limiting, audit log)
  pb_migrations/   Collection schema + RBAC migrations
  pb_schema.json   PocketBase collection schema export
scripts/           Deploy and utility scripts
public/            Static assets (favicon, icons)
docs/              Documentation
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Guide](docs/ARCHITECTURE.md) | System design, data flow, smart URL resolution, offline architecture |
| [Development Guide](docs/DEVELOPMENT.md) | Local setup, coding standards, testing, building |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment with Cloudflare Tunnel + PocketBase |
| [Contributing Guide](docs/CONTRIBUTING.md) | How to contribute, code style, PR process |
| [Security Policy](docs/SECURITY.md) | Reporting vulnerabilities, security best practices |

## License

This project is [MIT](LICENSE) licensed — see the [LICENSE](LICENSE) file for details.

Built with ❤ for every Barangay in the Philippines.
