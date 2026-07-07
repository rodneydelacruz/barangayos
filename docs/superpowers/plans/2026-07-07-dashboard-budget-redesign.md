# Dashboard & Budget Overview Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Dashboard and Budget Overview into a configurable widget-grid system with modern corporate design tokens and localStorage-persisted user preferences.

**Architecture:** A shared widget registry + config hook drives both pages. Each page renders widgets from a dynamic grid based on a `visibility/config` map in localStorage. The customization drawer (`WidgetSheet`) is a single reusable component. Design tokens live in `index.css` via Tailwind v4 `@theme`.

**Tech Stack:** React 19, Tailwind CSS v4 (via `@tailwindcss/vite`), Recharts (budget charts), localStorage for persistence.

## Global Constraints

- No new backend collections or API changes — all config stored in localStorage
- Existing Philippine color tokens (`--color-barangay`, `--color-narra`, `--color-bamboo`, `--color-red-pinoy`) must remain defined in `index.css` for backward compatibility
- All text remains in English for labels, Filipino for greeting/time-ago as currently used
- localStorage keys: `brgy-dashboard-config`, `brgy-budget-config`
- Role defaults: admin/staff/viewer as defined in spec
- All numeric/metrics displayed with tabular-nums class on `<span>`
- Donut chart must be implemented as pure CSS/SVG (avoid adding a chart library dependency)

---

### Task 1: Update Design Tokens

**Files:**
- Modify: `src/index.css:1-328`

**Interfaces:**
- Consumes: nothing
- Produces: new CSS custom properties consumed by all visual components

- [ ] **Step 1: Replace the `@theme` block colors and shadows**

Replace the existing `@theme` block in `src/index.css`:

```css
@theme {
  --color-background: var(--bg);
  --color-foreground: var(--fg);
  --color-card: var(--card);
  --color-card-foreground: var(--card-fg);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-fg);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-fg);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-fg);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-fg);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-fg);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-fg);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-surface-raised: var(--surface-raised);
  --color-text-subtle: var(--text-subtle);

  --color-capiz: var(--capiz);
  --color-barangay: var(--barangay);
  --color-gold: var(--gold);
  --color-narra: var(--narra);
  --color-bamboo: var(--bamboo);
  --color-red-pinoy: var(--red-pinoy);

  --color-accent: var(--accent-blue);
  --color-accent-teal: var(--accent-teal);
  --color-accent-rose: var(--accent-rose);
  --color-accent-amber: var(--accent-amber);

  --font-display: 'Outfit', 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --radius: 0.375rem;

  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 6px rgba(15, 23, 42, 0.05), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.06), 0 4px 6px rgba(15, 23, 42, 0.04);
  --shadow-xl: 0 20px 25px rgba(15, 23, 42, 0.08), 0 8px 10px rgba(15, 23, 42, 0.04);
  --shadow-ring: 0 0 0 1px var(--color-ring);
}
```

- [ ] **Step 2: Update `:root` light mode variables**

Replace the `:root { ... }` block color variable values:

```css
:root {
  color-scheme: light;

  --bg: #F1F5F9;
  --fg: #0F172A;
  --card: #FFFFFF;
  --card-fg: #0F172A;
  --popover: #FFFFFF;
  --popover-fg: #0F172A;
  --primary: #2563EB;
  --primary-fg: #FFFFFF;
  --secondary: #F1F5F9;
  --secondary-fg: #0F172A;
  --muted: #F8FAFC;
  --muted-fg: #64748B;
  --accent: #EFF6FF;
  --accent-fg: #1D4ED8;
  --destructive: #E11D48;
  --destructive-fg: #FFFFFF;
  --border: #E2E8F0;
  --input: #E2E8F0;
  --ring: #2563EB;

  --capiz: #F8F5F0;
  --barangay: #1B3A4B;
  --gold: #D4A04A;
  --narra: #5C4033;
  --bamboo: #E8DFD0;
  --red-pinoy: #CE1126;

  --accent-blue: #2563EB;
  --accent-teal: #0D9488;
  --accent-rose: #E11D48;
  --accent-amber: #D97706;

  --surface-raised: #F8FAFC;
  --text-subtle: #94A3B8;
}
```

- [ ] **Step 3: Update `.dark` mode variables**

```css
.dark {
  color-scheme: dark;

  --bg: #0B1120;
  --fg: #F8FAFC;
  --card: #131D2E;
  --card-fg: #F8FAFC;
  --popover: #131D2E;
  --popover-fg: #F8FAFC;
  --primary: #60A5FA;
  --primary-fg: #0B1120;
  --secondary: #1E293B;
  --secondary-fg: #F8FAFC;
  --muted: #1E293B;
  --muted-fg: #94A3B8;
  --accent: #1E3A5F;
  --accent-fg: #93C5FD;
  --destructive: #FB7185;
  --destructive-fg: #FFFFFF;
  --border: #1E293B;
  --input: #1E293B;
  --ring: #60A5FA;

  --capiz: #0B0A09;
  --barangay: #608B99;
  --gold: #E4B65E;
  --narra: #C4B4A0;
  --bamboo: #2A2622;
  --red-pinoy: #D94A45;

  --accent-blue: #60A5FA;
  --accent-teal: #2DD4BF;
  --accent-rose: #FB7185;
  --accent-amber: #FBBF24;

  --surface-raised: #0F172A;
  --text-subtle: #64748B;

  --shadow-sm: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
```

- [ ] **Step 4: Remove `.dark .elevated` rule and gold border-top pattern from existing dashboard cards** (no code change in index.css — those are inline styles in components, handled in later tasks)

- [ ] **Step 5: Verify no syntax errors**

Run: `npx tsc --noEmit` or the project's typecheck command
Expected: No errors (existing type errors unrelated to this change are OK)

- [ ] **Step 6: Commit**

```bash
git add src/index.css
git commit -m "feat: modern corporate design tokens for dashboard redesign"
```

---

### Task 2: Create useWidgetConfig Hook

**Files:**
- Create: `src/components/dashboard/useWidgetConfig.ts`

**Interfaces:**
- Consumes: nothing (reads role from existing `useDashboardData` return)
- Produces: `useWidgetConfig(page, role) => { config, updateWidget, resetToDefaults, isVisible }`

- [ ] **Step 1: Create the hook file**

Write `src/components/dashboard/useWidgetConfig.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react'

export interface WidgetState {
  visible: boolean
  config?: Record<string, unknown>
}

export interface DashboardConfig {
  version: number
  widgets: Record<string, WidgetState>
}

type Page = 'dashboard' | 'budget'

const STORAGE_KEYS: Record<Page, string> = {
  dashboard: 'brgy-dashboard-config',
  budget: 'brgy-budget-config',
}

const ROLE_DEFAULTS: Record<Page, Record<string, Record<string, WidgetState>>> = {
  dashboard: {
    admin: {
      hero: { visible: true },
      search: { visible: true },
      'kpi-strip': { visible: true, config: { metrics: ['residents', 'pendingDocuments', 'blotterActive', 'visitorsToday', 'meetingsToday', 'assets', 'settledCases'] } },
      'quick-actions': { visible: true },
      tasks: { visible: true },
      'activity-feed': { visible: true, config: { pageSize: 5 } },
      'document-chart': { visible: true, config: { chartType: 'bar' } },
      'system-status': { visible: true },
      'budget-snapshot': { visible: true, config: { metric: 'balance' } },
    },
    staff: {
      hero: { visible: true },
      search: { visible: true },
      'kpi-strip': { visible: true, config: { metrics: ['residents', 'pendingDocuments', 'blotterActive', 'visitorsToday', 'meetingsToday', 'settledCases'] } },
      'quick-actions': { visible: true },
      tasks: { visible: true },
      'activity-feed': { visible: true, config: { pageSize: 5 } },
      'document-chart': { visible: true, config: { chartType: 'bar' } },
      'system-status': { visible: true },
      'budget-snapshot': { visible: true, config: { metric: 'balance' } },
    },
    viewer: {
      hero: { visible: true },
      search: { visible: true },
      'kpi-strip': { visible: true, config: { metrics: ['residents', 'pendingDocuments', 'blotterActive'] } },
      tasks: { visible: true },
      'document-chart': { visible: true, config: { chartType: 'bar' } },
    },
  },
  budget: {
    admin: {
      'stat-cards': { visible: true, config: { metrics: ['income', 'appropriated', 'disbursed', 'balance', 'utilization'] } },
      'compliance-warnings': { visible: true },
      'expense-cards': { visible: true, config: { detailMode: 'detailed' } },
      'disbursements-chart': { visible: true, config: { chartType: 'bar' } },
      'revenue-chart': { visible: true, config: { chartType: 'bar' } },
      'utilization-chart': { visible: true, config: { chartType: 'line' } },
    },
    staff: {
      'stat-cards': { visible: true, config: { metrics: ['income', 'appropriated', 'disbursed', 'balance'] } },
      'compliance-warnings': { visible: true },
      'expense-cards': { visible: true, config: { detailMode: 'detailed' } },
      'disbursements-chart': { visible: true, config: { chartType: 'bar' } },
      'revenue-chart': { visible: true, config: { chartType: 'bar' } },
      'utilization-chart': { visible: true, config: { chartType: 'line' } },
    },
    viewer: {
      'stat-cards': { visible: true, config: { metrics: ['income', 'appropriated', 'balance'] } },
      'expense-cards': { visible: true, config: { detailMode: 'compact' } },
    },
  },
}

function loadConfig(page: Page, role: string): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[page])
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardConfig
      if (parsed.version === 1) return parsed
    }
  } catch {}
  return getDefaultConfig(page, role)
}

function getDefaultConfig(page: Page, role: string): DashboardConfig {
  const roleKey = role in ROLE_DEFAULTS[page] ? role : 'viewer'
  return { version: 1, widgets: { ...ROLE_DEFAULTS[page][roleKey] } }
}

function saveConfig(page: Page, config: DashboardConfig) {
  localStorage.setItem(STORAGE_KEYS[page], JSON.stringify(config))
}

export function useWidgetConfig(page: Page, role: string) {
  const [config, setConfig] = useState<DashboardConfig>(() => loadConfig(page, role))

  useEffect(() => {
    saveConfig(page, config)
  }, [page, config])

  const updateWidget = useCallback((id: string, changes: Partial<WidgetState>) => {
    setConfig((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [id]: { ...prev.widgets[id], ...changes },
      },
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setConfig(getDefaultConfig(page, role))
  }, [page, role])

  const isVisible = useCallback(
    (id: string): boolean => config.widgets[id]?.visible ?? false,
    [config],
  )

  const getWidgetConfig = useCallback(
    (id: string): Record<string, unknown> | undefined => config.widgets[id]?.config,
    [config],
  )

  return { config, updateWidget, resetToDefaults, isVisible, getWidgetConfig } as const
}
```

- [ ] **Step 2: Verify file exists and is valid**

Run: `npx tsc --noEmit src/components/dashboard/useWidgetConfig.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/useWidgetConfig.ts
git commit -m "feat: add useWidgetConfig hook for dashboard/budget personalization"
```

---

### Task 3: Create Widget Registry

**Files:**
- Create: `src/components/dashboard/widgetRegistry.tsx`

**Interfaces:**
- Consumes: nothing (pure data + component references)
- Produces: `WIDGET_REGISTRY` object mapping IDs to definitions, used by WidgetSheet and both pages

- [ ] **Step 1: Create the registry file**

Write `src/components/dashboard/widgetRegistry.tsx`:

```tsx
import type { ComponentType } from 'react'
import { SlidersHorizontal } from 'lucide-react'

export interface WidgetDefinition {
  id: string
  label: string
  description: string
  roles: string[]
  configFields?: ConfigField[]
}

export interface ConfigField {
  key: string
  label: string
  type: 'checkbox-list' | 'segmented' | 'number'
  options?: { label: string; value: string }[]
  items?: { label: string; value: string }[]
  min?: number
  max?: number
}

export const DASHBOARD_WIDGETS: WidgetDefinition[] = [
  {
    id: 'kpi-strip',
    label: 'KPI Metrics',
    description: 'Key performance indicator cards',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'metrics', label: 'Show Metrics', type: 'checkbox-list', items: [
        { label: 'Residents', value: 'residents' },
        { label: 'Document Requests', value: 'pendingDocuments' },
        { label: 'Blotter Cases', value: 'blotterActive' },
        { label: 'Visitors', value: 'visitorsToday' },
        { label: 'Meetings Today', value: 'meetingsToday' },
        { label: 'Assets', value: 'assets' },
        { label: 'Settled Cases', value: 'settledCases' },
      ] },
    ],
  },
  {
    id: 'quick-actions',
    label: 'Quick Actions',
    description: 'Frequently used action buttons',
    roles: ['admin', 'staff', 'viewer'],
  },
  {
    id: 'tasks',
    label: 'Priority Tasks',
    description: 'Role-based pending tasks',
    roles: ['admin', 'staff', 'viewer'],
  },
  {
    id: 'activity-feed',
    label: 'Activity Feed',
    description: 'Recent system activity',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'pageSize', label: 'Items to show', type: 'number', min: 3, max: 20 },
    ],
  },
  {
    id: 'document-chart',
    label: 'Document Status Chart',
    description: 'Document distribution visualization',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'segmented', options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Donut', value: 'donut' },
      ] },
    ],
  },
  {
    id: 'system-status',
    label: 'System Status',
    description: 'Database, network, and version info',
    roles: ['admin', 'staff'],
  },
  {
    id: 'budget-snapshot',
    label: 'Budget Snapshot',
    description: 'Quick budget overview card',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'metric', label: 'Highlight Metric', type: 'segmented', options: [
        { label: 'Income', value: 'income' },
        { label: 'Balance', value: 'balance' },
        { label: 'Disbursed', value: 'disbursed' },
      ] },
    ],
  },
]

export const BUDGET_WIDGETS: WidgetDefinition[] = [
  {
    id: 'stat-cards',
    label: 'Stat Cards',
    description: 'Summary financial metrics',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'metrics', label: 'Show Metrics', type: 'checkbox-list', items: [
        { label: 'Total Income', value: 'income' },
        { label: 'Appropriated', value: 'appropriated' },
        { label: 'Disbursed', value: 'disbursed' },
        { label: 'Balance', value: 'balance' },
        { label: 'Utilization', value: 'utilization' },
      ] },
    ],
  },
  {
    id: 'expense-cards',
    label: 'Expense Class Cards',
    description: 'PS, MOOE, CO breakdown',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'detailMode', label: 'Display Mode', type: 'segmented', options: [
        { label: 'Detailed', value: 'detailed' },
        { label: 'Compact', value: 'compact' },
      ] },
    ],
  },
  {
    id: 'disbursements-chart',
    label: 'Disbursements Chart',
    description: '30-day disbursement trend',
    roles: ['admin', 'staff'],
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'segmented', options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Line', value: 'line' },
        { label: 'Area', value: 'area' },
      ] },
    ],
  },
  {
    id: 'revenue-chart',
    label: 'Revenue Chart',
    description: '30-day revenue trend',
    roles: ['admin', 'staff'],
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'segmented', options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Line', value: 'line' },
        { label: 'Area', value: 'area' },
      ] },
    ],
  },
  {
    id: 'utilization-chart',
    label: 'Utilization Rate Chart',
    description: 'Budget utilization rate trend',
    roles: ['admin', 'staff'],
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'segmented', options: [
        { label: 'Line', value: 'line' },
        { label: 'Area', value: 'area' },
      ] },
    ],
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/widgetRegistry.tsx
git commit -m "feat: add widget registry for dashboard and budget"
```

---

### Task 4: Build WidgetSheet (Customization Drawer)

**Files:**
- Create: `src/components/dashboard/WidgetSheet.tsx`

**Interfaces:**
- Consumes: `WidgetDefinition[]`, `DashboardConfig`, `(id, changes) => void`
- Produces: Reusable slide-in panel for toggling and configuring widgets

- [ ] **Step 1: Create WidgetSheet component**

Write `src/components/dashboard/WidgetSheet.tsx`:

```tsx
import { X, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { WidgetDefinition, ConfigField } from './widgetRegistry'
import type { DashboardConfig, WidgetState } from './useWidgetConfig'

interface WidgetSheetProps {
  open: boolean
  onClose: () => void
  widgets: WidgetDefinition[]
  config: DashboardConfig
  onUpdateWidget: (id: string, changes: Partial<WidgetState>) => void
  onReset: () => void
}

export function WidgetSheet({ open, onClose, widgets, config, onUpdateWidget, onReset }: WidgetSheetProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-surface-overlay" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-border bg-card shadow-xl motion-fade-in motion-slide-up">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="size-4" />
            Customize
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {widgets.map((w) => {
              const state = config.widgets[w.id]
              return (
                <div key={w.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{w.label}</p>
                      <p className="text-xs text-muted-foreground">{w.description}</p>
                    </div>
                    <label className="relative inline-flex h-5 w-9 cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={state?.visible ?? false}
                        onChange={(e) => onUpdateWidget(w.id, { visible: e.target.checked })}
                      />
                      <span className="absolute inset-0 rounded-full bg-muted-foreground/30 transition-colors peer-checked:bg-accent-blue peer-focus-visible:outline-2 peer-focus-visible:outline-ring" />
                      <span className="absolute left-0.5 size-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                    </label>
                  </div>

                  {w.configFields && state?.visible && (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      {w.configFields.map((field) => (
                        <WidgetConfigField
                          key={field.key}
                          field={field}
                          value={(state.config as Record<string, unknown>)?.[field.key]}
                          onChange={(val) =>
                            onUpdateWidget(w.id, {
                              config: { ...(state.config as Record<string, unknown>), [field.key]: val },
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={onReset}
            className="w-full rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Reset to Role Defaults
          </button>
        </div>
      </div>
    </>
  )
}

function WidgetConfigField({
  field,
  value,
  onChange,
}: {
  field: ConfigField
  value: unknown
  onChange: (val: unknown) => void
}) {
  if (field.type === 'checkbox-list' && field.items) {
    const selected: string[] = Array.isArray(value) ? value : field.items.map((i) => i.value)
    return (
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</p>
        <div className="space-y-1">
          {field.items.map((item) => (
            <label key={item.value} className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="size-3.5 rounded border-border text-accent-blue focus:ring-accent-blue"
                checked={selected.includes(item.value)}
                onChange={() => {
                  const next = selected.includes(item.value)
                    ? selected.filter((v) => v !== item.value)
                    : [...selected, item.value]
                  onChange(next)
                }}
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'segmented' && field.options) {
    const current = (value as string) ?? field.options[0]?.value
    return (
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</p>
        <div className="flex overflow-hidden rounded-md border border-border">
          {field.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
                current === opt.value
                  ? 'bg-accent-blue text-white'
                  : 'bg-card text-muted-foreground hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'number') {
    const num = (value as number) ?? field.min ?? 5
    return (
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</p>
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={num}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-20 rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    )
  }

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/WidgetSheet.tsx
git commit -m "feat: add WidgetSheet customization drawer"
```

---

### Task 5: Build DashboardBudgetSnapshot Widget

**Files:**
- Create: `src/pages/DashboardBudgetSnapshot.tsx`

**Interfaces:**
- Consumes: `{ metric: string }` config from widget config
- Produces: compact budget card component for dashboard

- [ ] **Step 1: Create the Budget Snapshot widget**

Write `src/pages/DashboardBudgetSnapshot.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Landmark } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getAppropriations } from '@/api/appropriations'
import { getIncomeAccounts } from '@/api/incomeAccounts'
import { getDisbursements } from '@/api/disbursements'

interface DashboardBudgetSnapshotProps {
  metric?: string
}

export default function DashboardBudgetSnapshot({ metric = 'balance' }: DashboardBudgetSnapshotProps) {
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalAppropriated, setTotalAppropriated] = useState(0)
  const [totalDisbursed, setTotalDisbursed] = useState(0)

  useEffect(() => {
    const year = new Date().getFullYear()
    Promise.all([
      getAppropriations(year),
      getIncomeAccounts(year),
      getDisbursements(),
    ]).then(([apprs, accts, disc]) => {
      setTotalAppropriated(apprs.reduce((s, a) => s + a.appropriated_amount, 0))
      setTotalIncome(accts.reduce((s, a) => s + a.budgeted_amount, 0))
      setTotalDisbursed(disc.reduce((s, d) => s + d.amount, 0))
    }).catch(() => {})
  }, [])

  const balance = totalAppropriated - totalDisbursed
  const utilization = totalAppropriated > 0 ? Math.round((totalDisbursed / totalAppropriated) * 100) : 0

  const highlightValue = metric === 'income' ? totalIncome : metric === 'disbursed' ? totalDisbursed : balance
  const highlightLabel = metric === 'income' ? 'Total Income' : metric === 'disbursed' ? 'Disbursed' : 'Balance'

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Landmark className="size-3.5" />
          Budget Overview
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{highlightLabel}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">₱{highlightValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Utilization</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{utilization}%</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-blue transition-all"
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DashboardBudgetSnapshot.tsx
git commit -m "feat: add Budget Snapshot widget for dashboard"
```

---

### Task 6: Refactor Dashboard to Widget Grid

**Files:**
- Modify: `src/pages/Dashboard.tsx:1-44`
- Modify: `src/pages/DashboardHero.tsx` (style update — remove gold border-top)
- Modify: `src/pages/DashboardSearch.tsx` (style update)
- Modify: `src/pages/DashboardQuickActions.tsx` (style update)
- Modify: `src/pages/DashboardTasks.tsx` (style update)
- Modify: `src/pages/DashboardSystemStatus.tsx` (style update)
- Modify: `src/pages/DashboardActivity.tsx` (accept pageSize config)

**Interfaces:**
- Consumes: `useWidgetConfig`, `widgetRegistry`, all dashboard sub-components already exist
- Produces: dynamic widget-grid Dashboard

- [ ] **Step 1: Rewrite `Dashboard.tsx`**

```tsx
import { useState } from 'react'
import DashboardHero from './DashboardHero'
import DashboardSearch from './DashboardSearch'
import DashboardKPI from './DashboardKPI'
import DashboardQuickActions from './DashboardQuickActions'
import DashboardTasks from './DashboardTasks'
import DashboardActivity from './DashboardActivity'
import DashboardChart from './DashboardChart'
import DashboardSystemStatus from './DashboardSystemStatus'
import DashboardBudgetSnapshot from './DashboardBudgetSnapshot'
import { useDashboardData } from './hooks/useDashboardData'
import { useWidgetConfig } from '@/components/dashboard/useWidgetConfig'
import { DASHBOARD_WIDGETS } from '@/components/dashboard/widgetRegistry'
import { WidgetSheet } from '@/components/dashboard/WidgetSheet'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user, stats, tasks, recentActivity, loading } = useDashboardData()
  const role = user?.role ?? 'viewer'
  const userName = user?.name ?? 'User'
  const { config, updateWidget, resetToDefaults, isVisible, getWidgetConfig } = useWidgetConfig('dashboard', role)
  const [sheetOpen, setSheetOpen] = useState(false)

  const documentItems = Object.entries(stats.documentByStatus).map(([key, count]) => {
    const colorMap: Record<string, string> = {
      pending: '#f59e0b', processing: '#3b82f6', for_release: '#10b981',
      released: '#6b7280', cancelled: '#ef4444',
    }
    return { label: key.replace(/_/g, ' '), count, color: colorMap[key] ?? '#6b7280' }
  })

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Overview of barangay records and system activity</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
          Customize
        </button>
      </div>

      <div className="space-y-5">
        {isVisible('hero') && <DashboardHero userName={userName} role={role} stats={stats} />}
        {isVisible('search') && <DashboardSearch />}
        {isVisible('kpi-strip') && (
          <DashboardKPI stats={stats} role={role} loading={loading} config={getWidgetConfig('kpi-strip')} />
        )}
        {isVisible('quick-actions') && <DashboardQuickActions role={role} />}
        <div className={cn('grid gap-5 lg:grid-cols-2', (!isVisible('tasks') || !isVisible('activity-feed')) && '')}>
          {isVisible('tasks') && <DashboardTasks tasks={tasks} />}
          {isVisible('activity-feed') && <DashboardActivity activities={recentActivity} config={getWidgetConfig('activity-feed')} />}
        </div>
        <div className={cn('grid gap-5 lg:grid-cols-2', (!isVisible('document-chart') || !isVisible('budget-snapshot')) && '')}>
          {isVisible('document-chart') && <DashboardChart title="Document Status Distribution" items={documentItems} total={stats.documentTotal} config={getWidgetConfig('document-chart')} />}
          {isVisible('budget-snapshot') && <DashboardBudgetSnapshot metric={(getWidgetConfig('budget-snapshot') as { metric?: string })?.metric} />}
        </div>
        {isVisible('system-status') && <DashboardSystemStatus />}
      </div>

      <WidgetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        widgets={DASHBOARD_WIDGETS}
        config={config}
        onUpdateWidget={updateWidget}
        onReset={resetToDefaults}
      />
    </>
  )
}
```

- [ ] **Step 2: Update `DashboardSearch.tsx` — no visual changes needed (gold ring stays)**

- [ ] **Step 4: Update `DashboardHero.tsx` — remove gold border-top, make card cleaner**

Edit `DashboardHero.tsx`:
- Remove the gold top-border accent only: container class changes from `rounded-xl border border-border border-t-2 border-gold bg-card shadow-sm` to `rounded-lg border border-border bg-card shadow-sm`
- Keep `bg-gold/10` and `text-gold` for icons — palette is preserved

- [ ] **Step 5: Update `DashboardKPI.tsx` to accept config-driven metrics**

Change the interface and filter logic:

```tsx
interface DashboardKPIProps {
  stats: DashboardStats
  role: Role
  loading: boolean
  config?: Record<string, unknown>
}
```

Add at the start of component body:
```tsx
const selectedMetrics = (config?.metrics as string[]) ?? null
```

Add a `metricKey` field to each card for stable matching against config keys:

```tsx
interface KpiCard {
  label: string
  metricKey: string  // NEW: matches config metric keys
  value: number | string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  roles: Role[]
}
```

Update each card entry to include `metricKey`:
```tsx
{ label: 'Residents', metricKey: 'residents', value: stats.residents, sub: `${stats.voters} voters`, icon: Users, color: 'text-barangay', roles: ['admin', 'staff', 'viewer'] },
{ label: 'Document Requests', metricKey: 'pendingDocuments', value: stats.pendingDocuments, sub: 'pending', icon: FileText, color: 'text-amber-500', roles: ['admin', 'staff', 'viewer'] },
{ label: 'Blotter Cases', metricKey: 'blotterActive', value: stats.blotterActive, sub: 'active', icon: Scale, color: 'text-blue-500', roles: ['admin', 'staff', 'viewer'] },
{ label: 'Visitors', metricKey: 'visitorsToday', value: stats.visitorsToday, sub: `${stats.visitorsActive} now`, icon: DoorOpen, color: 'text-emerald-500', roles: ['admin', 'staff'] },
{ label: 'Meetings Today', metricKey: 'meetingsToday', value: stats.meetingsToday, sub: 'today', icon: Calendar, color: 'text-purple-500', roles: ['admin', 'staff'] },
{ label: 'Assets', metricKey: 'assets', value: `₱${(stats.assetsValue / 1000).toFixed(1)}K`, sub: `${stats.assetsTotal} items`, icon: Package, color: 'text-narra', roles: ['admin'] },
{ label: 'Settled Cases', metricKey: 'settledCases', value: stats.settledCases, sub: 'total', icon: CheckCircle2, color: 'text-emerald-500', roles: ['admin', 'staff'] },
```

Then filter:
```tsx
const roleCards = allCards.filter((card) => card.roles.includes(role))
const visibleCards = selectedMetrics
  ? roleCards.filter((card) => selectedMetrics.includes(card.metricKey))
  : roleCards
```

Keep the gold top-border accent strip on the card (div with `className="h-1 w-full bg-gold/60"`) — palette is preserved.

- [ ] **Step 6: Update `DashboardChart.tsx` to accept chart type config**

Change the interface to accept `config?: Record<string, unknown>` and add a donut variant. At the component start:

```tsx
interface DashboardChartProps {
  title: string
  items: BarItem[]
  total: number
  config?: Record<string, unknown>
}
```

Add inside the component:
```tsx
const chartType = (config?.chartType as string) ?? 'bar'
```

Then wrap the content in a conditional:
```tsx
{chartType === 'donut' ? renderDonut() : renderBar()}
```

Implement `renderDonut`:
```tsx
function renderDonut() {
  const total = items.reduce((s, i) => s + i.count, 0) || 1
  let cumulativeAngle = 0
  return (
    <div className="flex items-center justify-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-muted)" strokeWidth="16" />
        {items.map((item) => {
          const angle = (item.count / total) * 360
          const startAngle = cumulativeAngle
          cumulativeAngle += angle
          if (angle === 0) return null
          const startRad = ((startAngle - 90) * Math.PI) / 180
          const endRad = ((startAngle + angle - 90) * Math.PI) / 180
          const x1 = 60 + 48 * Math.cos(startRad)
          const y1 = 60 + 48 * Math.sin(startRad)
          const x2 = 60 + 48 * Math.cos(endRad)
          const y2 = 60 + 48 * Math.sin(endRad)
          const largeArc = angle > 180 ? 1 : 0
          return (
            <path
              key={item.label}
              d={`M 60 60 L ${x1} ${y1} A 48 48 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
            />
          )
        })}
        <circle cx="60" cy="60" r="32" fill="var(--color-card)" />
      </svg>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-foreground">{item.label}</span>
            <span className="font-medium text-muted-foreground tabular-nums">{Math.round((item.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Change the card container: replace `rounded-xl` with `rounded-lg`.

- [ ] **Step 7: Update `DashboardActivity.tsx` to accept pageSize config**

Change the interface:
```tsx
interface DashboardActivityProps {
  activities: ApiActivity[]
  config?: Record<string, unknown>
}
```

Replace the constant `INITIAL_SHOW = 5` with a derived value:
```tsx
const pageSize = (props.config?.pageSize as number) ?? 5
const [visibleCount, setVisibleCount] = useState(pageSize)
```

Also change `LOAD_MORE` to use `pageSize` instead of the constant `5`.

- [ ] **Step 8: Update `DashboardSystemStatus.tsx` — style only**

Replace `rounded-xl` with `rounded-lg` on the card. Keep all other styling (gold accents unchanged).

- [ ] **Step 9: Update `DashboardQuickActions.tsx` — style only**

Replace `rounded-xl` with `rounded-lg` on the card container. No other changes.

- [ ] **Step 10: Update `DashboardTasks.tsx` — style only**

Replace `rounded-xl` with `rounded-lg` on the card container. No other changes.

- [ ] **Step 11: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/DashboardHero.tsx src/pages/DashboardKPI.tsx src/pages/DashboardChart.tsx src/pages/DashboardActivity.tsx src/pages/DashboardSystemStatus.tsx src/pages/DashboardQuickActions.tsx src/pages/DashboardTasks.tsx
git commit -m "feat: refactor Dashboard to widget-grid with config-driven sub-components"
```

---

### Task 7: Refactor BudgetOverview to Widget Grid

**Files:**
- Modify: `src/features/finance/BudgetOverview.tsx:1-123`
- Modify: `src/components/finance/ExpenseClassCard.tsx:1-41` (add detailMode)
- Modify: `src/components/finance/KpiChart.tsx` (add chartType)

**Interfaces:**
- Consumes: `useWidgetConfig`, `BUDGET_WIDGETS`, existing budget sub-components
- Produces: dynamic widget-grid Budget Overview

- [ ] **Step 1: Rewrite `BudgetOverview.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { FiscalYearSelector } from '@/components/finance/FiscalYearSelector'
import { ExpenseClassCard } from '@/components/finance/ExpenseClassCard'
import { ComplianceWarning } from '@/components/finance/ComplianceWarning'
import { KpiChart } from '@/components/finance/KpiChart'
import { getAppropriations, type ApiAppropriation } from '@/api/appropriations'
import { getIncomeAccounts, type ApiIncomeAccount } from '@/api/incomeAccounts'
import { getDisbursements, type ApiDisbursement } from '@/api/disbursements'
import { getRevenues, type ApiRevenue } from '@/api/revenues'
import { getFinanceConfig, type ComplianceWarningItem } from '@/api/settings'
import { useWidgetConfig } from '@/components/dashboard/useWidgetConfig'
import { BUDGET_WIDGETS } from '@/components/dashboard/widgetRegistry'
import { WidgetSheet } from '@/components/dashboard/WidgetSheet'
import { useAuth } from '@/auth/useAuth'

function buildDateRange(days = 30): string[] {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function aggregateDaily<T extends { amount: number }>(
  records: (T & { disbursement_date?: string; revenue_date?: string })[],
  dateField: 'disbursement_date' | 'revenue_date',
): { date: string; value: number }[] {
  const map = new Map<string, number>()
  for (const r of records) {
    const d = r[dateField] || ''
    if (d) map.set(d, (map.get(d) || 0) + r.amount)
  }
  return buildDateRange(30).map((date) => ({ date, value: map.get(date) || 0 }))
}

export function BudgetOverview() {
  const { user } = useAuth()
  const role = user?.role ?? 'viewer'
  const { config, updateWidget, resetToDefaults, isVisible, getWidgetConfig } = useWidgetConfig('budget', role)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [year, setYear] = useState(new Date().getFullYear())
  const [appropriations, setAppropriations] = useState<ApiAppropriation[]>([])
  const [incomeAccounts, setIncomeAccounts] = useState<ApiIncomeAccount[]>([])
  const [disbursements, setDisbursements] = useState<ApiDisbursement[]>([])
  const [revenues, setRevenues] = useState<ApiRevenue[]>([])
  const [complianceWarnings, setComplianceWarnings] = useState<ComplianceWarningItem[]>([])

  async function load() {
    try {
      const [apprs, accts, disc, revs] = await Promise.all([
        getAppropriations(year),
        getIncomeAccounts(year),
        getDisbursements(),
        getRevenues(),
      ])
      setAppropriations(apprs)
      setIncomeAccounts(accts)
      setDisbursements(disc)
      setRevenues(revs)
      const fc = await getFinanceConfig()
      if (fc?.complianceWarnings?.[String(year)]) {
        setComplianceWarnings(fc.complianceWarnings[String(year)])
      } else {
        setComplianceWarnings([])
      }
    } catch (_) {}
  }

  useEffect(() => { load() }, [year])

  const psItems = appropriations.filter((a) => a.expense_class === 'PS')
  const mooeItems = appropriations.filter((a) => a.expense_class === 'MOOE')
  const coItems = appropriations.filter((a) => a.expense_class === 'CO')

  const psAppropriated = psItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const psDisbursed = psItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)
  const mooeAppropriated = mooeItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const mooeDisbursed = mooeItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)
  const coAppropriated = coItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const coDisbursed = coItems.reduce((s, a) => s + (a.disbursed_amount || 0), 0)

  const totalAppropriated = psAppropriated + mooeAppropriated + coAppropriated
  const totalDisbursed = psDisbursed + mooeDisbursed + coDisbursed
  const totalIncome = incomeAccounts.reduce((s, a) => s + a.budgeted_amount, 0)

  const disbursementTrend = aggregateDaily(disbursements, 'disbursement_date')
  const revenueTrend = aggregateDaily(revenues, 'revenue_date')
  const utilizationData = buildDateRange(30).map((date) => {
    const rate = totalAppropriated > 0 ? Math.round((totalDisbursed / totalAppropriated) * 100) : 0
    return { date, value: rate }
  })

  const statConfig = getWidgetConfig('stat-cards') as { metrics?: string[] } | undefined
  const selectedStats = statConfig?.metrics ?? ['income', 'appropriated', 'disbursed', 'balance', 'utilization']

  const expenseConfig = getWidgetConfig('expense-cards') as { detailMode?: string } | undefined
  const detailMode = (expenseConfig?.detailMode as 'detailed' | 'compact') ?? 'detailed'

  const statMap: Record<string, { label: string; value: number }> = {
    income: { label: 'Total Income', value: totalIncome },
    appropriated: { label: 'Appropriated', value: totalAppropriated },
    disbursed: { label: 'Disbursed', value: totalDisbursed },
    balance: { label: 'Balance', value: totalAppropriated - totalDisbursed },
    utilization: { label: 'Utilization Rate', value: totalAppropriated > 0 ? Math.round((totalDisbursed / totalAppropriated) * 100) : 0 },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Budget Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <FiscalYearSelector value={year} onChange={setYear} />
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
            Customize
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {isVisible('stat-cards') && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {selectedStats.map((key: string) => {
              const s = statMap[key]
              if (!s) return null
              const isUtil = key === 'utilization'
              return (
                <div key={key} className="rounded-lg border border-border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {isUtil ? `${s.value}%` : `₱${s.value.toLocaleString()}`}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {isVisible('compliance-warnings') && <ComplianceWarning warnings={complianceWarnings} />}

        {isVisible('expense-cards') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExpenseClassCard title="PS (Personnel Services)" appropriated={psAppropriated} obligated={psDisbursed} disbursed={psDisbursed} itemCount={psItems.length} detailMode={detailMode} />
            <ExpenseClassCard title="MOOE (Maintenance & Other Operating Expenses)" appropriated={mooeAppropriated} obligated={mooeDisbursed} disbursed={mooeDisbursed} itemCount={mooeItems.length} detailMode={detailMode} />
            <ExpenseClassCard title="CO (Capital Outlay)" appropriated={coAppropriated} obligated={coDisbursed} disbursed={coDisbursed} itemCount={coItems.length} detailMode={detailMode} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isVisible('disbursements-chart') && (
            <KpiChart title="Disbursements (30 days)" type={(getWidgetConfig('disbursements-chart') as { chartType?: string })?.chartType ?? 'bar'} data={disbursementTrend} color="#C9953E" format="currency" />
          )}
          {isVisible('revenue-chart') && (
            <KpiChart title="Revenue (30 days)" type={(getWidgetConfig('revenue-chart') as { chartType?: string })?.chartType ?? 'bar'} data={revenueTrend} color="#22C55E" format="currency" />
          )}
          {isVisible('utilization-chart') && (
            <KpiChart title="Utilization Rate (30 days)" type={(getWidgetConfig('utilization-chart') as { chartType?: string })?.chartType ?? 'line'} data={utilizationData} color="#3B82F6" format="number" />
          )}
        </div>
      </div>

      <WidgetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        widgets={BUDGET_WIDGETS}
        config={config}
        onUpdateWidget={updateWidget}
        onReset={resetToDefaults}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update `ExpenseClassCard.tsx` to accept detailMode prop**

Change interface to add `detailMode?: 'detailed' | 'compact'` and conditionally render:

```tsx
interface ExpenseClassCardProps {
  title: string
  appropriated: number
  obligated: number
  disbursed: number
  itemCount: number
  detailMode?: 'detailed' | 'compact'
}
```

Inside the component, when `detailMode === 'compact'`:
```tsx
const obligatedPct = appropriated > 0 ? Math.round((obligated / appropriated) * 100) : 0
const f = (n: number) => '₱' + n.toLocaleString()

if (detailMode === 'compact') {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-lg font-bold text-foreground tabular-nums">{f(appropriated)}</p>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${Math.min(obligatedPct, 100)}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{obligatedPct}% utilized</p>
      </CardContent>
    </Card>
  )
}

// Otherwise the existing detailed rendering stays, but with updated card styling
return (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {/* existing content with rounded-lg classes updated */}
    </CardContent>
  </Card>
)
```

- [ ] **Step 3: Update `KpiChart.tsx` to accept `'area'` chart type**

Update the import to include `AreaChart` and `Area`:
```tsx
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
```

Update the type to include `'area'`:
```tsx
type: 'bar' | 'line' | 'area'
```

Add the area chart case in the render:
```tsx
{type === 'area' ? (
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="var(--color-muted-fg)" />
    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatVal(v, format)} stroke="var(--color-muted-fg)" />
    <Tooltip formatter={(v) => [formatVal(v as number, format), title]} labelFormatter={(l) => l} />
    <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
  </AreaChart>
) : ...}
```

Replace the CartesianGrid `stroke` attribute from `"hsl(var(--border))"` to `"var(--color-border)"` and `"hsl(var(--muted-foreground))"` to `"var(--color-muted-fg)"` for compatibility with Tailwind v4 variables.

- [ ] **Step 4: Commit**

```bash
git add src/features/finance/BudgetOverview.tsx src/components/finance/ExpenseClassCard.tsx src/components/finance/KpiChart.tsx
git commit -m "feat: refactor BudgetOverview to widget-grid with config-driven sub-components"
```

---

### Task 8: TypeScript Check & Final Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new type errors (existing errors unrelated to this change are OK)

- [ ] **Step 2: Run build**

Run: `npm run build` or `vite build`
Expected: Build succeeds

- [ ] **Step 3: Fix any issues found**

If there are errors, fix them and re-run.

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: type and build fixes for dashboard redesign"
```
