# Barangay System — Group E: Reports Dashboard

## Overview

A Reports Dashboard at `/reports` that aggregates data across all existing domains — residents, documents, blotter, assets, and visitors — into a single tabbed view with stat cards, CSS bar charts, and summary tables. No new PocketBase collections or env vars. Zero new JS dependencies.

---

## 1. Page Structure

### Route

`/reports` — admin and staff only (`hasRole('admin', 'staff')`)

### Sidebar

New **Reports** nav group after Administration:
- **Reports Dashboard** → `/reports` (icon: `BarChart3` from lucide-react)

### Layout

```
PageHeader title="Reports Dashboard" subtitle="Summary and insights across all barangay data"
├── Tab bar (horizontal underline tabs)
│   ├── Overview
│   ├── Demographics
│   ├── Documents
│   ├── Blotter
│   ├── Assets
│   └── Visitors
└── Active tab content
```

**Tab switch**: Client-side state, no URL param needed. Tab click changes local `activeTab` state.

---

## 2. API: `src/api/reports.ts`

Each function fetches data via existing API modules and computes summaries client-side. The existing `getFullList()` pattern fetches all records — acceptable for barangay-scale data.

```typescript
import { getResidents } from './residents'
import { getDocuments } from './documents'
import { getBlotters } from './blotter'
import { getAssets } from './assets'
import { getVisitors } from './visitors'

// --- Demographics ---

interface DemographicsReport {
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

// --- Documents ---

interface DocumentsReport {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  todayRequests: number
}

export async function getDocumentsReport(): Promise<DocumentsReport>

// --- Blotter ---

interface BlotterReport {
  total: number
  byStatus: Record<string, number>
  byIncidentType: Record<string, number>
}

export async function getBlotterReport(): Promise<BlotterReport>

// --- Assets ---

interface AssetsReport {
  total: number
  byType: Record<string, number>
  byCondition: Record<string, number>
  byStatus: Record<string, number>
  totalValue: number
}

export async function getAssetsReport(): Promise<AssetsReport>

// --- Visitors ---

interface VisitorsReport {
  total: number
  activeVisits: number
  byPurpose: Record<string, number>
}

export async function getVisitorsReport(): Promise<VisitorsReport>

// --- Combined ---

interface OverviewReport {
  demographics: DemographicsReport
  documents: DocumentsReport
  blotter: BlotterReport
  assets: AssetsReport
  visitors: VisitorsReport
}

export async function getOverviewReport(): Promise<OverviewReport>
```

**Error handling**: Each function wraps its fetch in try/catch. On failure, returns a zeroed report shape rather than throwing — the UI always renders.

---

## 3. UI: ReportsPage (`src/features/reports/ReportsPage.tsx`)

### Tab Bar

```tsx
const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'demographics', label: 'Demographics', icon: Users },
  { id: 'documents', label: 'Documents', icon: ClipboardList },
  { id: 'blotter', label: 'Blotter', icon: FileText },
  { id: 'assets', label: 'Assets', icon: Package },
  { id: 'visitors', label: 'Visitors', icon: DoorOpen },
]
```

Horizontal flex layout. Active tab has gold underline + gold text. Inactive tabs use muted foreground with hover state. Each tab shows a lucide icon + label.

### Shared Visual Components

All defined inline in ReportsPage (or as small sub-components in the same file):

#### Stat Card
Follows existing Dashboard pattern:
```tsx
<Card className="overflow-hidden motion-lift">
  <div className="h-1 w-full bg-gold/60" />
  <CardContent className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      </div>
      <Icon className={cn('size-5 shrink-0 mt-0.5', color)} />
    </div>
  </CardContent>
</Card>
```

#### CSS Bar Chart
```tsx
<div className="space-y-2">
  {items.map(item => (
    <div key={item.label} className="flex items-center gap-3">
      <span className="w-24 text-xs font-medium truncate">{item.label}</span>
      <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{
            width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
            backgroundColor: item.color ?? '#C9953E',
          }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-foreground">{item.count}</span>
    </div>
  ))}
</div>
```

#### Summary Table
A simple two-column table: Label | Count. Used for distributions with many categories (e.g., by document type).

### Tab Contents

#### Overview Tab
- **Stat cards row**: Total Residents, Total Document Requests, Total Blotter Cases, Total Assets, Total Visitors — one row, same grid pattern as Dashboard
- **Mini bar charts row**: Top 5 puroks by population, Documents by status, Blotter by status (each as a compact card with a CSS bar chart)

#### Demographics Tab
- **Stat cards**: Total Residents, Voters, Seniors, PWD, 4Ps
- **By Purok**: CSS bar chart showing residents per purok, sorted descending
- **By Gender**: Two stat cards side by side (Male / Female)
- **By Civil Status**: CSS bar chart (single / married / widowed / separated)
- **Age Groups**: CSS bar chart (Under 18 / Adult 18-59 / Senior 60+)

#### Documents Tab
- **Stat cards**: Total Requests, Today's Requests, Pending, For Release
- **By Status**: CSS bar chart (pending / processing / for_release / released / cancelled)
- **By Document Type**: Summary table (barangay_clearance, business_permit, etc.)

#### Blotter Tab
- **Stat cards**: Total Cases (by status — same 6 cards as Dashboard)
- **By Status**: CSS bar chart
- **By Incident Type**: CSS bar chart (blotter / complaint / dispute / other)

#### Assets Tab
- **Stat cards**: Total Assets, Total Value, By Condition (good/fair/poor/damaged as small cards)
- **By Type**: CSS bar chart (equipment / furniture / it_equipment / vehicle / facility / tool / other)
- **By Condition**: CSS bar chart
- **By Status**: CSS bar chart (available / assigned / disposed)

#### Visitors Tab
- **Stat cards**: Total Visits, Active Now (time_out = null)
- **By Purpose**: CSS bar chart or summary table

### States

**Loading**: All tabs show `animate-pulse` skeleton cards for stat cards and skeleton bars for charts on initial load. Data is fetched when the tab is first activated (lazy fetch, cached in local state).

**Error**: On fetch failure, the tab shows a subtle banner: "Unable to load [section] data. The data may be incomplete." within the tab content. Individual report functions return zeroed shapes so the UI still renders.

**Empty**: If a domain has no records, the tab shows stat cards with all zeros and a brief empty message: "No [domain] records yet."

---

## 4. Cross-Cutting

### File Structure

**New files:**
- `src/api/reports.ts` — report aggregation functions
- `src/features/reports/ReportsPage.tsx` — tabbed reports dashboard
- `src/features/reports/index.ts` — barrel export

**Modified files:**
- `src/routes/index.tsx` — add `/reports` route
- `src/components/Sidebar.tsx` — add Reports nav group

### Route
```typescript
import { ReportsPage } from '@/features/reports'

<Route
  path="reports"
  element={
    <ProtectedRoute roles={['admin', 'staff']}>
      <ReportsPage />
    </ProtectedRoute>
  }
/>
```

### Sidebar Update
Add after Administration group:
```typescript
{
  label: 'Reports',
  items: [
    { to: '/reports', label: 'Reports Dashboard', icon: BarChart3, roles: ['admin', 'staff'] },
  ],
},
```

### Icons
Add `BarChart3`, `LayoutDashboard` to lucide-react imports in Sidebar. `Users`, `ClipboardList`, `FileText`, `Package`, `DoorOpen` are already imported.

### No PocketBase Migration
No new collections. No env vars. No Cloudinary integration. No activity logging (read-only).

### Consistent Patterns
- `cn()` utility for conditional classes
- Dark mode via `dark:` variants
- Responsive: stat grid adapts columns (1 → 2 → 3 → 6)
- Loading skeletons via `animate-pulse`
- `lucide-react` icons
- No new npm dependencies

---

## 5. Implementation Order

1. `src/api/reports.ts` — 6 report aggregation functions + overview composite
2. `src/features/reports/ReportsPage.tsx` — tabbed reports page with all 6 tab views
3. `src/routes/index.tsx` — add `/reports` import and route
4. `src/components/Sidebar.tsx` — add Reports nav group
5. Verify `npm run build` passes
