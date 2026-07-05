# Task 1: Reports API module

**Files:**
- Create: `src/api/reports.ts`

**Interfaces:**
- Consumes: `getResidents()` → `ApiResident[]` from `@/api/residents`
- Consumes: `getDocuments()` → `ApiDocument[]` from `@/api/documents`
- Consumes: `getBlotters()` → `ApiBlotter[]` from `@/api/blotter`
- Consumes: `getAssets()` → `ApiAsset[]` from `@/api/assets`
- Consumes: `getVisitors()` → `ApiVisitor[]` from `@/api/visitors`
- Produces: exported types and functions below

## Global Constraints Reminder
- Zero new JS dependencies — use only what's in package.json
- Error handling: report functions return zeroed shapes on failure, never throw
- `cn()` utility (`@/lib/utils`) available if needed
- All existing API signatures are at `@/api/residents`, `@/api/documents`, `@/api/blotter`, `@/api/assets`, `@/api/visitors`

## Steps

### Step 1: Create `src/api/reports.ts`

Write the file with these interfaces and functions:

```typescript
import { getResidents, type ApiResident } from './residents'
import { getDocuments, type ApiDocument } from './documents'
import { getBlotters, type ApiBlotter } from './blotter'
import { getAssets, type ApiAsset } from './assets'
import { getVisitors, type ApiVisitor } from './visitors'

// --- Demographics ---

export interface DemographicsReport {
  total: number
  byPurok: Record<string, number>
  byGender: { male: number; female: number }
  byCivilStatus: Record<string, number>
  voters: number
  senior: number
  pwd: number
  fourPs: number
  ageGroups: { under18: number; adult: number; senior: number }
}

export async function getDemographicsReport(): Promise<DemographicsReport>
// Fetches all residents, computes: total, byPurok, byGender, byCivilStatus,
// voters, senior, pwd, fourPs, ageGroups (under18=age<18, adult=18-59, senior=60+)
// On catch: return zeroed shape

// --- Documents ---

export interface DocumentsReport {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  todayRequests: number
}

export async function getDocumentsReport(): Promise<DocumentsReport>
// Fetches all documents, computes: total, byStatus, byType, todayRequests
// todayRequests checks if requested_at starts with today's YYYY-MM-DD
// On catch: return zeroed shape

// --- Blotter ---

export interface BlotterReport {
  total: number
  byStatus: Record<string, number>
  byIncidentType: Record<string, number>
}

export async function getBlotterReport(): Promise<BlotterReport>
// Fetches all blotters, computes: total, byStatus, byIncidentType
// On catch: return zeroed shape

// --- Assets ---

export interface AssetsReport {
  total: number
  byType: Record<string, number>
  byCondition: Record<string, number>
  byStatus: Record<string, number>
  totalValue: number
}

export async function getAssetsReport(): Promise<AssetsReport>
// Fetches all assets, computes: total, byType, byCondition, byStatus, totalValue
// totalValue sums current_value for each asset
// On catch: return zeroed shape

// --- Visitors ---

export interface VisitorsReport {
  total: number
  activeVisits: number
  byPurpose: Record<string, number>
}

export async function getVisitorsReport(): Promise<VisitorsReport>
// Fetches all visitors, computes: total, activeVisits (time_out is falsy), byPurpose
// On catch: return zeroed shape

// --- Overview (composite) ---

export interface OverviewReport {
  demographics: DemographicsReport
  documents: DocumentsReport
  blotter: BlotterReport
  assets: AssetsReport
  visitors: VisitorsReport
}

export async function getOverviewReport(): Promise<OverviewReport>
// Runs all 5 report functions in parallel via Promise.all
// Returns combined result
```

### Step 2: Verify build passes

Run: `npm run build`

Expected: builds cleanly (imports match existing API modules)

### Step 3: Commit

```bash
git add src/api/reports.ts
git commit -m "feat: add Reports API module with aggregation functions"
```
