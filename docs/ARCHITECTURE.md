# Architecture Guide

## System Overview

BarangayOS uses a single-server architecture where PocketBase serves both the REST API and the static SPA files on the same port (8090). A Cloudflare Tunnel provides secure public internet access without exposing the server's IP or opening firewall ports.

```
                         ┌──────────────────────────────┐
                         │       Cloudflare Network      │
                         │  CDN - WAF - DDoS Protection  │
                         └──────┬───────────────────────┘
                                │
                     ┌──────────┴──────────┐
                     │  cloudflared tunnel  │
                     └──────────┬──────────┘
                                │
                     ┌──────────┴──────────┐
                     │   localhost:8090     │
                     │   PocketBase         │
                     │   +-- pb_data/       │
                     │   |   +-- data.db <--+-- Litestream --> Cloudflare R2
                     │   +-- pb_public/     │
                     │       +-- index.html │
                     └─────────────────────┘

LAN Users: http://192.168.x.x:8090 (direct, 0ms latency)
Remote:    https://app.yourdomain.com (via Cloudflare Tunnel, HTTPS)
```

Both the API (`/api/*`) and the SPA (everything else) are served by PocketBase on the same port. The Cloudflare Tunnel exposes `localhost:8090` to the internet.

## Smart URL Resolution

The app automatically selects the optimal API URL based on the client's network environment. This logic lives in `src/lib/apiConfig.ts`.

| Scenario | Resolution |
|----------|-----------|
| Vite dev server (`localhost:8080`) | Uses `VITE_API_URL` directly |
| Phone on cellular (HTTPS via tunnel) | Uses tunnel URL (mixed-content blocked otherwise) |
| Desktop on office LAN (HTTP) | Pings server's LAN IP with 3s timeout, uses it if reachable |
| Remote desktop (HTTP, different network) | LAN ping times out, falls back to tunnel URL |

### Resolution algorithm

1. If `VITE_LOCAL_API_URL` is empty (dev mode), use `VITE_API_URL` directly
2. If the page was loaded over HTTPS, skip local fallback entirely (browsers block HTTPS to HTTP requests)
3. If the page is HTTP, probe `VITE_LOCAL_API_URL/api/health` with a 3-second timeout
4. If the local server responds, use the LAN URL for zero-latency, offline-capable access
5. If the local server is unreachable, fall back to the tunnel URL

## Offline Architecture

The offline system uses IndexedDB as a persistent write queue. This allows users to continue working even when the network connection drops.

```
User Action -> try API call -> success -> done
                            -> failure -> enqueue to IndexedDB
                                      -> connection restored -> flush queue -> done
```

### Components

- **`src/offline/queue.ts`** — IndexedDB wrapper using the `idb` library. Provides `enqueue()`, `dequeue()`, `peekAll()`, and `queueSize()` operations. Stores pending create/update/delete operations with their payloads and timestamps.

- **`src/offline/syncManager.ts`** — Flushes the queue when the connection is restored. Processes items FIFO (first-in, first-out) with status notifications via a listener pattern. Emits `idle`, `syncing`, `error`, or `complete` status updates.

- **`src/offline/OfflineIndicator.tsx`** — UI component that displays the current sync status to the user.

## Authentication & Authorization

PocketBase handles authentication via email/password. The app uses role-based access control with three roles, enforced server-side by PocketBase's collection rules.

| Role | Permissions |
|------|------------|
| **Admin** | Full CRUD on all collections, user management, system settings |
| **Staff** | Create/update records, documents, residents; limited delete |
| **Viewer** | Read-only access to most collections |

### Auth flow

1. User submits email/password to PocketBase via `login()`
2. Server validates credentials and returns an auth token
3. Token is stored in PocketBase's `authStore` (memory, not localStorage)
4. `getCurrentUser()` extracts role and user data from the auth record
5. Route guards (`ProtectedRoute`) check both authentication and role before rendering protected pages

### Server-side rules

Collection-level access rules are defined in PocketBase migration files (`pocketbase/pb_migrations/`). Example:

```javascript
// Only admins can delete records
"deleteRule": "@request.auth.role = \"admin\""
```

## State Management

No external state management library is used. The app relies on:

- **React built-in state** — `useState`, `useEffect`, `useContext` for component-level and shared state
- **PocketBase SDK client** — Singleton client (`src/api/client.ts`) as the single source of truth for authentication
- **Custom hooks** — `useApiHealth()` for periodic server health polling every 30 seconds

## API Layer

API modules in `src/api/` follow a consistent pattern:

- Each PocketBase collection has a dedicated module (e.g., `residents.ts`, `documents.ts`)
- Functions return typed responses and use the shared PocketBase client from `getClient()`
- Errors are normalized through `src/api/errorHandler.ts`

### Error handling hierarchy

1. `ClientResponseError` (PocketBase SDK) — mapped to user-friendly messages:
   - 429: "Rate limit exceeded"
   - 403: "You do not have permission"
   - 401: "Your session has expired" (auto-clears auth)
2. `TypeError: Failed to fetch` — "Network error. Operation will be queued offline."
3. All other errors — Generic message with original error attached

### Retry logic

The `shouldRetry()` and `retryDelay()` functions implement exponential backoff for retryable errors (429, 503), with delays: 2s, 4s, 8s, 16s, capped at 30s.

## Data Flow

```
User Action
  |
  +-- Auth: src/auth/session.ts -> PocketBase SDK -> REST API
  |
  +-- API: src/api/{module}.ts -> getClient() -> PocketBase SDK -> REST API
  |
  +-- Offline: On network error -> enqueue() -> IndexedDB
  |   +-- On reconnect -> flushQueue() -> REST API
  |
  +-- Error: handleApiError() -> ApiError -> UI notification
```

## Data Model

Core PocketBase collections (defined in `pocketbase/pb_migrations/`):

| Collection | Type | Purpose |
|------------|------|---------|
| `users` | auth | User accounts with `role` field (admin/staff/viewer) |
| `records` | base | Barangay document records with status workflow |
| `residents` | base | Resident profiles with demographic tags |
| `households` | base | Family groupings with household head assignments |
| `documents` | base | Document requests with release tracking |
| `blotter` | base | Incident/blotter records with case workflow |
| `assets` | base | Barangay property inventory with condition tracking |
| `calendar` | base | Event scheduling |
| `agenda` | base | Meeting agenda items and resolutions |
| `visitors` | base | Visitor check-in/out log |
| `activity_log` | base | System audit trail |
| `system_settings` | base | Key-value configuration store |
| `appropriations` | base | Budget appropriations with expense class (PS/MOOE/CO) |
| `fund_sources` | base | Fund sources with statutory rules (20% DF, SK, etc.) |
| `revenues` | base | Revenue collections linked to income accounts |
| `disbursements` | base | Disbursement records linked to obligations |
| `obligations` | base | Obligation requests linked to appropriations |
| `income_accounts` | base | Chart of accounts for revenue tracking |
| `finance_audit_logs` | base | Finance-specific audit trail (separate from activity_log) |

## Finance Audit Trail

The finance module has a dedicated audit trail that logs every create/update/delete operation across all 6 finance collections. This is completely separate from the general `activity_log` system.

**Architecture decision:** Audit logging is implemented on the **frontend side** rather than in PocketBase hooks. Testing revealed that PocketBase 0.39.5's hook events (`onRecordAfterCreate`, `onRecordAfterCreateRequest`, etc.) do not fire for REST API requests made through the JS SDK — they only fire for Admin UI operations or internal `dao.saveRecord()` calls.

**How it works:**
1. Each mutation function in `src/api/*.ts` (e.g., `createAppropriation`) first performs the main API call
2. On success, it calls `createFinanceAuditLog()` from `src/api/financeAudit.ts`
3. The audit entry is written to the `finance_audit_logs` collection with: action, collection name, record ID, details, amount, user name, and timestamp
4. Audit failures are intentionally silent — they never block the main operation

**Viewing:** The `FinanceAudit` page at `/finance/audit` displays the trail with collection filter, pagination, and a detail flyout showing user/timestamp info.
