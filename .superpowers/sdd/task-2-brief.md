# Task 2: ReportsPage component

**Files:**
- Create: `src/features/reports/ReportsPage.tsx`
- Create: `src/features/reports/index.ts`

**Interfaces:**
- Consumes: `getDemographicsReport()`, `getDocumentsReport()`, `getBlotterReport()`, `getAssetsReport()`, `getVisitorsReport()`, `getOverviewReport()` from `@/api/reports`
- Consumes: types `DemographicsReport`, `DocumentsReport`, `BlotterReport`, `AssetsReport`, `VisitorsReport`, `OverviewReport` from `@/api/reports`
- Consumes: `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card`
- Consumes: `PageHeader` from `@/components/ui/PageHeader`
- Consumes: `cn()` from `@/lib/utils`
- Consumes: `LayoutDashboard`, `Users`, `ClipboardList`, `FileText`, `Package`, `DoorOpen` from `lucide-react`
- Produces: `ReportsPage` — default export

## Global Constraints
- Zero new JS dependencies
- CSS-only animations (motion-lift, motion-fade-in, motion-slide-up)
- Dark mode via `dark:` Tailwind variants
- `cn()` for conditional classes

## Steps

### Step 1: Create `src/features/reports/index.ts`

```typescript
export { default as ReportsPage } from './ReportsPage'
```

### Step 2: Create `src/features/reports/ReportsPage.tsx`

The full implementation code is in the plan at `docs/superpowers/plans/2026-07-05-barangay-group-e.md` lines 286-744. Create the file with that exact implementation.

Key components to include:
1. `TabId` type and `tabs` array with 6 tabs (overview, demographics, documents, blotter, assets, visitors)
2. `StatCard` component — matches Dashboard pattern with Card, gold accent bar, icon, label, value
3. `StatCardSkeleton` — animate-pulse loading state
4. `BarChart` component — CSS bar chart with labels, colored bars, count (gold `#C9953E` default color)
5. `BarChartSkeleton` — animate-pulse loading state
6. `SectionCard` — Card wrapper with Header/Title for chart sections
7. Default export `ReportsPage` with:
   - Tab state tracking via `activeTab` + `loadedTabs` Set (lazy load per tab)
   - `loadTab()` useCallback that fetches data on first tab activation
   - `sortedEntries()` helper that converts Record<string,number> to sorted {label,count}[] array
   - `renderTabContent()` — dispatches to render functions based on activeTab
   - 6 render functions: renderOverview, renderDemographics, renderDocuments, renderBlotter, renderAssets, renderVisitors
   - Loading state shows skeletons, empty state handled by BarChart ("No data")
   - Tab bar with underline style, active = gold border/text

### Step 3: Verify build passes

Run: `npm run build`

Expected: builds cleanly

### Step 4: Commit

```bash
git add src/features/reports/index.ts src/features/reports/ReportsPage.tsx
git commit -m "feat: add Reports Dashboard page with tabbed views and CSS bar charts"
```
