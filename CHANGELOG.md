# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial open-source release
- MIT License
- Contributor Covenant Code of Conduct
- Complete documentation suite (architecture, development, deployment, security, contributing guides)
- CI/CD pipeline configuration (GitHub Actions)
- Community health files (issue templates, PR template, security policy)

## [0.0.0] — Initial Development

### Added

- **Resident Management** — Complete resident profiles with demographics, tags (voter, senior, PWD, 4Ps, deceased), and family associations
- **Household Management** — Track families, household heads, and resident groupings
- **Document Request & Release** — End-to-end document lifecycle (request → processing → release)
- **Blotter / Incident Records** — Complaint tracking with hearing, settlement, and escalation workflow
- **Barangay Assets** — Inventory management with condition tracking
- **Calendar & Agenda** — Meeting scheduling, agenda items, session management
- **Visitor Log** — Digital visitor check-in/out system
- **Activity Logs** — Audit trail of system actions across all modules
- **Reports Dashboard** — Aggregated statistics and data visualization using Recharts
- **Finance Module** — Budget appropriations, fund sources, revenue tracking, disbursements, obligations, and income accounts
- **Finance Audit Trail** — Dedicated audit log for all financial transactions with user attribution
- **Offline Mode** — IndexedDB write queue with automatic flush on connection restore
- **Role-Based Access Control** — Admin, Staff, and Viewer roles with granular server-enforced permissions
- **Dark Mode** — Light/dark theme toggle with system preference detection
- **Cloudflare Tunnel Integration** — Secure public internet access without opening firewall ports
- **Database Backup** — Automatic S3-compatible backups to Cloudflare R2 via PocketBase Admin UI
- **Docker Deployment** — Two-container stack (nginx SPA + PocketBase API)
- **PocketBase Backend** — Go-based REST API with embedded SQLite and comprehensive RBAC rules
- **Smart URL Resolution** — Automatic API URL selection based on client network environment
- **PWA Support** — Service worker manifest for mobile-friendly access

### Tech

- React 19 with TypeScript 6
- Vite 8 for build tooling
- Tailwind CSS 4 for styling
- PocketBase 0.39.5 for backend
- Vitest 3 for unit testing
- Playwright for E2E testing
- oxlint for code linting
- Docker with multi-stage builds
- Cloudflare Tunnel for secure exposure
