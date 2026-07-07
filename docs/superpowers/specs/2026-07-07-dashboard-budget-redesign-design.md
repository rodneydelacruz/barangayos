# Dashboard & Budget Overview Redesign

**Date:** 2026-07-07
**Status:** Approved Design

## Overview

Reimagine the Dashboard and Budget Overview pages with a modern corporate visual direction, role-personalized defaults, and a fully customizable widget-based layout persisted in localStorage.

---

## Design Tokens

### Color Palette (Philippine Heritage — Preserved)

The original Philippine-inspired palette is kept unchanged. These new accent-* variables are added to support the new components (WidgetSheet toggles, segmented controls, chart accents) and map to the existing Philippine colors:

| Token | Light Hex | Dark Hex | Maps To | Usage |
|-------|-----------|----------|---------|-------|
| `--accent-blue` | `#1B3A4B` | `#608B99` | `--barangay` | Primary interactive (toggles, active states) |
| `--accent-teal` | `#0D9488` | `#2DD4BF` | New | Positive metrics, accent |
| `--accent-rose` | `#CE1126` | `#D94A45` | `--red-pinoy` | Destructive/urgent |
| `--accent-amber` | `#C9953E` | `#C9953E` | `--gold` | Warnings, highlights |

All original `--color-barangay`, `--color-narra`, `--color-bamboo`, `--color-red-pinoy`, `--color-gold`, `--color-capiz` tokens remain fully intact and functional.

### Typography

| Role | Face | Weight | Details |
|------|------|--------|---------|
| Display | Outfit | 600 | `letter-spacing: -0.02em` for headings |
| Body | Inter | 400/500 | 14px (`text-sm`) becomes default body |
| Mono | JetBrains Mono | 400/600 | All numeric/metric values, tabular lining |

### Border Radius

Keep existing `0.5rem` (8px). Remove the gold top-border accent strip on cards — use clean flat cards with subtle shadow instead.

### Shadows

Keep existing warm shadows using `rgba(0, 0, 0, ...)` — unchanged from the original design.

---

## Widget System Architecture

### Core Model

Both pages are a configurable grid of self-contained widget components. Widget state lives in localStorage under key `brgy-dashboard-config`.

### Storage Schema

```typescript
interface WidgetState {
  visible: boolean
  config?: Record<string, unknown>
}

interface DashboardConfig {
  version: 1
  widgets: Record<string, WidgetState>
}
```

Example stored config:
```json
{
  "version": 1,
  "widgets": {
    "kpi-strip": {
      "visible": true,
      "config": {
        "metrics": ["residents", "pendingDocs", "blotterActive", "visitors", "assets"]
      }
    },
    "activity-feed": { "visible": true, "config": { "pageSize": 5 } },
    "document-chart": { "visible": true, "config": { "chartType": "donut" } },
    "budget-snapshot": { "visible": false },
    "system-status": { "visible": false }
  }
}
```

Budget uses key `brgy-budget-config` with the same shape but its own widget IDs.

### Widget Catalog — Dashboard

| Widget ID | Config Keys | Role Defaults |
|-----------|-------------|---------------|
| `hero` | `{ }` | All roles: visible |
| `search` | `{ }` | All roles: visible |
| `kpi-strip` | `metrics: string[]`, `chartType: 'bar'\|'donut'` | Admin: 8, Staff: 6, Viewer: 3 |
| `quick-actions` | `{ }` | Admin/Staff: visible, Viewer: hidden |
| `tasks` | `{ }` | All roles: visible |
| `activity-feed` | `pageSize: number` | Admin/Staff: visible, Viewer: hidden |
| `document-chart` | `chartType: 'bar'\|'donut'` | All roles: visible (bar) |
| `system-status` | `{ }` | Admin/Staff: visible, Viewer: hidden |
| `budget-snapshot` | `metric: string` — which budget metric to highlight | Admin/Staff: visible, Viewer: hidden |

### Widget Catalog — Budget Overview

| Widget ID | Config Keys | Role Defaults |
|-----------|-------------|---------------|
| `stat-cards` | `metrics: string[]` — which 4-6 from {income, appropriated, disbursed, balance, utilization} | All: all 5 |
| `compliance-warnings` | `{ }` | Always visible when triggered |
| `expense-cards` | `detailMode: 'compact'\|'detailed'` | All: detailed |
| `disbursements-chart` | `chartType: 'bar'\|'line'\|'area'` | All: bar |
| `revenue-chart` | `chartType: 'bar'\|'line'\|'area'` | All: bar |
| `utilization-chart` | `chartType: 'line'\|'area'` | All: line |

### Widget Registry

A central `widgetRegistry` object maps widget IDs to their React components, config schemas, and role defaults. Both pages consume the same registry pattern:

```typescript
interface WidgetDefinition {
  component: React.ComponentType<{ config?: Record<string, unknown> }>
  defaultConfig: Record<string, unknown>
  roles: Role[]
  label: string
  description: string
}
```

---

## Page Layouts

### Dashboard

```
┌───────────────────────────────────────────────┐
│ Hero (greeting, clock, role badge)    [Customize]│
├───────────────────────────────────────────────┤
│ Search                                         │
├───────────────────────────────────────────────┤
│ KPI Strip (scrollable, N user-selected cards)  │
├─────────────────────┬─────────────────────────┤
│ Priority Tasks      │ Activity Feed           │
│                     │ (hidden if toggled off) │
├─────────────────────┼─────────────────────────┤
│ Document Chart      │ Budget Snapshot         │
│ (bar/donut)         │ (new, hidden if off)    │
├─────────────────────┴─────────────────────────┤
│ System Status     │ Quick Actions             │
└───────────────────────────────────────────────┘
```

### Budget Overview

```
┌───────────────────────────────────────────────┐
│ Budget Overview    [FY ▼]           [Customize]│
├───────────────────────────────────────────────┤
│ Stat Cards (N user-selected metrics)           │
├───────────────────────────────────────────────┤
│ Compliance Warnings (conditional)              │
├──────────────┬───────────────┬────────────────┤
│ PS Card      │ MOOE Card     │ CO Card        │
├──────────────┼───────────────┼────────────────┤
│ Disburse     │ Revenue       │ Utilization    │
│ Chart        │ Chart         │ Chart          │
└──────────────┴───────────────┴────────────────┘
```

When a widget is hidden, its grid area collapses (no empty placeholder). Rows with zero visible widgets are removed from the DOM.

---

## Customization UI

### Trigger

`SlidersHorizontal` icon button labeled "Customize" in the page header area.

### Panel

A `<Sheet>` component (slide-in from the right, `w-80`, with backdrop overlay). Content:

1. **Widget List** — each widget gets a section with:
   - Toggle switch (show/hide)
   - Expandable config panel (gear icon or chevron)
   - Config content depends on the widget type:
     - **KPI Strip**: Checkbox list of all available metrics
     - **Chart**: Segmented control for chart type (bar | donut | line | area)
     - **Activity Feed**: Number input for page size
     - **Stat Cards**: Checkbox list of budget metrics
     - **Expense Cards**: Segmented toggle for compact/detailed

2. **Reset button** — "Reset to Role Defaults" at the bottom, restores the role-based default config

3. **Auto-save** — every toggle/click updates localStorage immediately; no save button

### Inline Configuration

Each widget card also has a small `Settings2` icon in its top-right corner for quick chart-type switching without opening the drawer.

---

## New Components

### WidgetSheet (`src/components/dashboard/WidgetSheet.tsx`)
The customization drawer. Generic enough to accept widget definitions for either page.

### useWidgetConfig (`src/components/dashboard/useWidgetConfig.ts`)
Hook that manages localStorage read/write, merging with role defaults:

```typescript
function useWidgetConfig(page: 'dashboard' | 'budget', role: Role) => {
  config: DashboardConfig
  updateWidget: (id: string, changes: Partial<WidgetState>) => void
  resetToDefaults: () => void
}
```

### DashboardBudgetSnapshot (`src/pages/DashboardBudgetSnapshot.tsx`)
New widget showing a compact budget overview card (total income, disbursed, balance with a mini sparkline).

### KpiMetricPicker (`src/pages/KpiMetricPicker.tsx`)
Checkbox group used inside the widget sheet for selecting which KPI metrics to display.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Refactor to widget-grid pattern; consume `useWidgetConfig`; render widgets dynamically from registry |
| `src/pages/DashboardHero.tsx` | Update styling to new tokens (remove gold border-top, cooler card) |
| `src/pages/DashboardKPI.tsx` | Accept config-driven metric list; render only selected metrics |
| `src/pages/DashboardChart.tsx` | Accept `chartType` config prop; render bar or donut variant |
| `src/pages/DashboardActivity.tsx` | Accept `pageSize` from config |
| `src/pages/DashboardSystemStatus.tsx` | Minor styling update to new tokens |
| `src/pages/DashboardQuickActions.tsx` | Minor styling update |
| `src/pages/DashboardTasks.tsx` | Minor styling update |
| `src/features/finance/BudgetOverview.tsx` | Refactor to widget-grid pattern; consume `useWidgetConfig`; render widgets dynamically |
| `src/components/finance/ExpenseClassCard.tsx` | Accept `detailMode` prop for compact/detailed |
| `src/components/finance/KpiChart.tsx` | Accept `chartType` prop for bar/line/area |
| `src/index.css` | Update `@theme` tokens (colors, shadows, radii); add modern corporate palette |

## New Files

| File | Purpose |
|------|---------|
| `src/components/dashboard/WidgetSheet.tsx` | Reusable customization drawer |
| `src/components/dashboard/useWidgetConfig.ts` | Shared hook for widget config persistence |
| `src/components/dashboard/widgetRegistry.tsx` | Widget definitions, role defaults, component mapping |
| `src/pages/DashboardBudgetSnapshot.tsx` | New compact budget widget for dashboard |
| `src/pages/KpiMetricPicker.tsx` | Checkbox list for KPI metric selection |

---

## Implementation Order

1. **Design tokens** — update `index.css` with new palette, shadows, radii
2. **`useWidgetConfig` hook** — localStorage read/write, merge with role defaults
3. **`widgetRegistry`** — define all widgets, defaults, component references
4. **Dashboard refactor** — wire up widget grid, replace static layout with dynamic rendering
5. **WidgetSheet** — build the customization drawer
6. **KPI Strip config** — wire metric selection into DashboardKPI
7. **Chart type switching** — add donut variant to DashboardChart, chart type config to KpiChart
8. **DashboardBudgetSnapshot** — new compact budget card
9. **Budget Overview refactor** — same widget-grid pattern
10. **ExpenseClassCard detail mode** — compact variant
11. **Cleanup** — remove unused imports, test all config permutations

---

## Self-Review Notes

- No TBD or TODOs remaining
- Widget IDs are consistent between registry and config schema
- Role defaults cover all three roles explicitly
- localStorage keys are namespaced to avoid collisions
- Backward compatibility: existing Philippine color tokens remain defined in index.css
- Scope: focused on two pages with shared architecture — no scope creep into other pages
- Ambiguity: chart types are explicitly listed per widget; no open interpretation
