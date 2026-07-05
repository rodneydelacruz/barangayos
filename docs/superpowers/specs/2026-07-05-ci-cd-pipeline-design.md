# CI/CD Pipeline Design

## Overview

Monolithic GitHub Actions workflow (`ci-cd.yml`) providing Continuous Integration and Continuous Deployment for the Barangay Records System.

## Triggers

| Trigger | Stage | What runs |
|---|---|---|
| Push to any branch | Dev | Lint → Typecheck → Test → Build |
| PR to main | Staging | Lint → Typecheck → Test → Build → Security |
| Push to main | Production | Lint → Typecheck → Test → Build → Security → Deploy |

## Job Pipeline

```
lint ──► typecheck ──► test ──► build ──► security ──► deploy-production
                                                  (PR/main only)   (main only)
```

## Job Details

### lint
- **Runner:** ubuntu-latest
- **Command:** `npx oxlint@latest .`
- **Cache:** node_modules via actions/cache

### typecheck
- **Depends on:** lint
- **Command:** `npx tsc -b`

### test
- **Depends on:** typecheck
- **Command:** `npx vitest run --reporter=verbose`
- **Config:** Add vitest and @vitest/coverage-v8 to devDependencies

### build
- **Depends on:** test
- **Command:** `npm run build`
- **Artifact:** Upload `dist/` for deploy job

### security
- **Runs on:** PR to main OR push to main
- **Steps:**
  1. `npm audit --audit-level=high`
  2. TruffleHog secret scanning
  3. CodeQL init + analyze (JavaScript/TypeScript)

### deploy-production
- **Runs on:** push to main only
- **Runner:** self-hosted, windows
- **Steps:**
  1. Download `dist/` artifact
  2. Copy to `pb_public/`
  3. Restart PocketBase service
  4. Health check against localhost:8090/api/health
  5. Slack/email notification on failure

## Caching

```
node_modules/ key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## Concurrency

- Cancel in-progress runs for same branch (except main).
- Group: `ci-cd-${{ github.ref }}

## Secrets Required

| Secret | Purpose |
|---|---|
| (none) | Self-hosted runner uses local .env.production |

## Rollback

On deploy failure, the old `pb_public/` contents remain intact (not overwritten until copy succeeds).
