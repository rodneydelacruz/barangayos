# Architecture Guide

## System Overview

BarangayOS uses a two-container Docker architecture. A **frontend** container (nginx) serves the SPA and proxies `/api/*` requests to a **PocketBase** container that provides the REST API and admin UI. A Cloudflare Tunnel provides secure public internet access through the nginx container.

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
                     │   nginx (port 8080)  │
                     │   SPA + API proxy    │
                     └──────────┬──────────┘
                                │ /api/*
                     ┌──────────┴──────────┐
                     │ PocketBase (port 8090)│
                     │   pb_data/ (volume)   │
                     └─────────────────────┘

LAN Users: http://192.168.x.x:8080 (through nginx, zero latency)
Remote:    https://app.yourdomain.com (via Cloudflare Tunnel → nginx, HTTPS)
Direct:    http://192.168.x.x:8090 (PocketBase admin UI, LAN only)
```

The nginx container serves the SPA and proxies `/api/*` and `/_/*` to the PocketBase container. The Cloudflare Tunnel exposes `localhost:8080` (nginx) to the internet. PocketBase port 8090 remains accessible on the LAN for direct admin access.

## Smart URL Resolution

The app automatically selects the optimal API URL based on the client's network environment. This logic lives in `frontend/src/lib/apiConfig.ts`.

| Scenario | Resolution |
|----------|-----------|
| Vite dev server (`localhost:8080`) | Uses `VITE_API_URL` directly |
| Phone on cellular (HTTPS via tunnel) | Uses tunnel URL (mixed-content blocked otherwise) |
| Desktop on office LAN (HTTP) | Pings server's LAN IP with 3s timeout, uses it if reachable |
| Remote desktop (HTTP, different network) | LAN ping times out, falls back to tunnel URL |

### Resolution algorithm

1. If `VITE_LOCAL_API_URL` is empty (dev mode), use `VITE_API_URL` directly
2. If the page was loaded over HTTPS, skip local fallback entirely (browsers block HTTPS → HTTP requests)
3. If the page is HTTP, probe `VITE_LOCAL_API_URL/api/health` with a 3-second timeout
4. If the local server responds, use the LAN URL for zero-latency, offline-capable access
5. If the local server is unreachable, fall back to the tunnel URL

This ensures that users inside the barangay office connect directly to the local server (fast, works offline), while remote users always use the secure tunnel URL.

## Offline Architecture

The offline system uses IndexedDB as a persistent write queue. This allows users to continue working even when the network connection drops — critical for barangay offices with intermittent internet.

```
User Action → try API call → success → done
                           → failure → enqueue to IndexedDB
                                     → connection restored → flush queue → done
```

### Components

- **`frontend/src/offline/queue.ts`** — IndexedDB wrapper using the `idb` library. Provides `enqueue()`, `dequeue()`, `peekAll()`, and `queueSize()` operations. Stores pending create/update/delete operations with their payloads and timestamps. Each item stores the API module, method name, and serialized arguments.

- **`frontend/src/offline/syncManager.ts`** — Flushes the queue when the connection is restored. Processes items FIFO (first-in, first-out) with status notifications via a listener pattern. Emits `idle`, `syncing`, `error`, or `complete` status updates. On error, failed items are kept in the queue for retry.

- **`frontend/src/offline/OfflineIndicator.tsx`** — UI component that displays the current sync status to the user. Shows a banner indicating offline mode, syncing progress, or confirmation when all queued operations complete.

## Authentication & Authorization

PocketBase handles authentication via email/password. The app uses role-based access control with three roles, enforced server-side by PocketBase's collection-level rules.

| Role | Permissions |
|------|------------|
| **Admin** | Full CRUD on all collections, user management, system settings |
| **Staff** | Create/update records, documents, residents; limited delete |
| **Viewer** | Read-only access to most collections |

### Auth flow

1. User submits email/password to PocketBase via `login()`
2. Server validates credentials and returns an auth token
3. Token is stored in PocketBase's `authStore` (in-memory, not localStorage)
4. `getCurrentUser()` extracts role and user data from the auth record
5. Route guards (`ProtectedRoute`) check both authentication status and user role before rendering protected pages
6. On session expiry, the user is redirected to the login page

### Server-side rules

Collection-level access rules are defined in PocketBase migration files at `backend/pb_migrations/`. These are JavaScript files that PocketBase executes on startup to configure collections and their access rules. Rules use `@request.auth.role` expressions:

```javascript
// Only admins can delete records
"deleteRule": "@request.auth.role = \"admin\""
```

```javascript
// Staff can create and update, but not delete
"createRule": "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"",
"updateRule": "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"",
"deleteRule": "@request.auth.role = \"admin\""
```

## State Management

No external state management library (Redux, Zustand, etc.) is used. The app relies entirely on React built-in features:

- **React built-in state** — `useState`, `useEffect`, `useContext` for component-level and shared state
- **PocketBase SDK client** — Singleton client (`frontend/src/api/client.ts`) as the single source of truth for authentication state. The `authStore` on the PocketBase client holds the current auth token and user data.
- **Custom hooks** — `useApiHealth()` for periodic server health polling (every 30 seconds), and feature-specific custom hooks for domain logic

This approach keeps the bundle size small and avoids unnecessary complexity. If your feature requires shared state across many components, consider React Context before reaching for an external library.

## API Layer

API modules in `frontend/src/api/` follow a consistent pattern:

- Each PocketBase collection has a dedicated module (e.g., `residents.ts`, `documents.ts`, `blotter.ts`)
- Modules export typed async functions for each operation (create, read, update, delete, list with filters)
- Functions return typed responses and use the shared PocketBase client from `getClient()`
- Errors are normalized through `frontend/src/api/errorHandler.ts`

There are **22 API modules** in total, covering all PocketBase collections used by the application.

### Error handling hierarchy

1. `ClientResponseError` (PocketBase SDK) — mapped to user-friendly messages:
   - 429: "Rate limit exceeded. Please wait before trying again."
   - 403: "You do not have permission to perform this action."
   - 401: "Your session has expired. Please log in again." (auto-clears auth)
2. `TypeError: Failed to fetch` — "Network error. Your changes will be saved offline and synced when the connection is restored."
3. All other errors — Generic message with the original error attached for debugging

### Retry logic

The `shouldRetry()` and `retryDelay()` functions in `errorHandler.ts` implement exponential backoff for retryable status codes (429, 503):

| Attempt | Delay |
|---------|-------|
| 1st retry | 2s |
| 2nd retry | 4s |
| 3rd retry | 8s |
| 4th retry | 16s |
| 5th+ retry | 30s (capped) |

Non-retryable errors (4xx except 429) are immediately passed to the error handler.

## Data Flow

```
User Action
  │
  ├── Auth: frontend/src/auth/session.ts → PocketBase SDK → REST API
  │
  ├── API: frontend/src/api/{module}.ts → getClient() → PocketBase SDK → REST API
  │
  ├── Offline: On network error → enqueue() → IndexedDB
  │   └── On reconnect → flushQueue() → REST API (FIFO order)
  │
  └── Error: handleApiError() → ApiError → UI notification (sonner toast)
```

## Data Model

Core PocketBase collections (defined in `backend/pb_migrations/`):

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

Total: **19 collections** — 1 auth collection + 18 base collections.

## Finance Audit Trail

The finance module has a dedicated audit trail that logs every create/update/delete operation across all 6 finance collections. This is completely separate from the general `activity_log` system.

### Architecture decision

Audit logging is implemented on the **frontend side** rather than in PocketBase hooks. During development, we discovered that PocketBase 0.39.5's hook events (`onRecordAfterCreate`, `onRecordAfterCreateRequest`, etc.) do not fire for REST API requests made through the JS SDK — they only fire for Admin UI operations or internal `dao.saveRecord()` calls. A frontend-side approach was chosen as the most reliable alternative.

### How it works

1. Each mutation function in `frontend/src/api/*.ts` (e.g., `createAppropriation`) first performs the main API call
2. On success, it calls `createFinanceAuditLog()` from `frontend/src/api/financeAudit.ts`
3. The audit entry is written to the `finance_audit_logs` collection with: action type (create/update/delete), collection name, record ID, details diff, financial amount, user name, and timestamp
4. Audit failures are intentionally silent — they never block the main operation. This ensures that a failed audit write doesn't prevent the user from completing their work.

### Viewing the audit trail

The `FinanceAudit` page at `/finance/audit` displays the trail with:
- Collection filter (filter by appropriations, revenues, disbursements, etc.)
- Pagination for browsing through entries
- Detail flyout showing user attribution and timestamp information
