# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the dashboard with personalized hero greeting, cross-module KPIs, role-based task triage, and add deceased tagging, lazy loading, and alphabetical sort.

**Architecture:** The dashboard is a single page component in `src/pages/Dashboard.tsx`. It will be rewritten to fetch data via a new custom hook, split into four visual sections (hero, KPIs, tasks, activity). Feature pages will get a shared Pagination component. The resident model adds `is_deceased`.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, PocketBase, lucide-react, Vitest

## Global Constraints

- All existing Filipino design tokens (capiz, barangay, gold, narra, bamboo, red-pinoy) must be preserved
- All existing motion utilities (motion-fade-in, motion-slide-up, motion-lift, motion-stagger-*) must be reused
- PocketBase API calls must use existing error handling via `handleApiError`
- Role types: `'admin' | 'staff' | 'viewer'` from `@/auth/session`
- User data from `getCurrentUser()` in `@/auth/session`

---

### Task 1: PocketBase migration — add is_deceased to residents

**Files:**
- Create: `pocketbase/pb_migrations/010_add_is_deceased_to_residents.js`
- Modify: `src/api/residents.ts` (types + summary)

**Interfaces:**
- Consumes: existing `residents` collection schema
- Produces: `is_deceased: boolean` field on residents, `ResidentData.is_deceased`, `ApiResident.is_deceased`

- [ ] **Step 1: Create migration file**

```js
// pocketbase/pb_migrations/010_add_is_deceased_to_residents.js
migrate((db) => {
  const collection = dao.findCollectionByNameOrId("residents")
  collection.schema.addField(new SchemaField({
    name: "is_deceased",
    type: "bool",
    required: false,
    default: false,
  }))
  dao.saveCollection(collection)
}, (db) => {
  const collection = dao.findCollectionByNameOrId("residents")
  collection.schema.removeField("is_deceased")
  dao.saveCollection(collection)
})
```

- [ ] **Step 2: Update resident API types**

Edit `src/api/residents.ts`:
- Add `is_deceased?: boolean` to `ResidentData` interface
- Add `is_deceased: boolean` to `ApiResident` interface

- [ ] **Step 3: Update getResidentsSummary to exclude deceased**

Edit `getResidentsSummary()` in `src/api/residents.ts` to filter `!r.is_deceased` in summary counts (or keep all — defer to the feature page filtering). For now, add the field. The summary can include all; filtering by active can be done at the UI level.

- [ ] **Step 4: Commit**

```bash
git add pocketbase/pb_migrations/010_add_is_deceased_to_residents.js src/api/residents.ts
git commit -m "feat: add is_deceased field to residents"
```

---

### Task 2: Deceased badge in resident UI

**Files:**
- Modify: `src/features/residents/` (list item and detail view)

**Interfaces:**
- Consumes: `ApiResident.is_deceased`
- Produces: visual deceased badge in resident list cards and profile detail

- [ ] **Step 1: Find the resident list item component**

Search for the component that renders each resident in the list view (likely in `src/features/residents/index.tsx` or a sub-component).

- [ ] **Step 2: Add deceased badge to list item**

In the resident list item, when `resident.is_deceased` is true, show a badge:

```tsx
{resident.is_deceased && (
  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800">
    Deceased
  </span>
)}
```

- [ ] **Step 3: Add deceased badge to detail view**

In the resident detail/profile view, show a prominent badge or tag at the name header.

- [ ] **Step 4: Commit**

```bash
git add src/features/residents/
git commit -m "feat: add deceased badge to resident list and detail"
```

---

### Task 3: Alphabetical default sort for resident profiles

**Files:**
- Modify: `src/features/residents/` index file

- [ ] **Step 1: Find the resident list data fetch**

Locate where residents are fetched in the residents page. Change the default sort parameter from `'-id'` or similar to `'last_name,first_name'`.

- [ ] **Step 2: Update the fetch call**

```ts
// Before
const residents = await getResidents()
// or
const residents = await getClient().collection('residents').getFullList({ sort: '-id' })

// After
const residents = await getClient().collection('residents').getFullList({ sort: 'last_name,first_name' })
```

If the fetch uses `getResidents()` from the API module, update the default sort in that function.

- [ ] **Step 3: Commit**

```bash
git add src/features/residents/ src/api/residents.ts
git commit -m "feat: default alphabetical sort for resident profiles"
```

---

### Task 4: Reusable Pagination component

**Files:**
- Create: `src/components/ui/Pagination.tsx`
- Test: `src/components/ui/__tests__/Pagination.test.tsx`

**Interfaces:**
- Consumes: `{ page: number, totalPages: number, totalItems: number, onPageChange: (page: number) => void, pageSize?: number }`
- Produces: `<Pagination>` component

- [ ] **Step 1: Write the Pagination component**

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  pageSize?: number
}

export default function Pagination({ page, totalPages, totalItems, onPageChange, pageSize = 25 }: PaginationProps) {
  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between border-t px-2 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {start} to {end} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => (
            <span key={p} className="flex items-center">
              {idx > 0 && arr[idx - 1] !== p - 1 && (
                <span className="px-1 text-muted-foreground">...</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  'flex size-8 items-center justify-center rounded-md text-sm font-medium',
                  p === page
                    ? 'bg-barangay text-white'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {p}
              </button>
            </span>
          ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Pagination.tsx
git commit -m "feat: add reusable Pagination component"
```

---

### Task 5: Dashboard data hook

**Files:**
- Create: `src/pages/hooks/useDashboardData.ts`

**Interfaces:**
- Produces: `{ user, greeting, timeGreeting, stats, tasks, recentActivity, loading }`

- [ ] **Step 1: Create the data hook**

```ts
import { useState, useEffect } from 'react'
import { getCurrentUser, type AuthUser, type Role } from '@/auth/session'
import { getResidentsSummary } from '@/api/residents'
import { getBlottersSummary } from '@/api/blotter'
import { getDocumentsReport } from '@/api/reports'
import { getVisitorsReport } from '@/api/reports'
import { getAssetsReport } from '@/api/reports'
import { getActivities } from '@/api/activity'
import type { ApiActivity } from '@/api/activity'

export interface DashboardStats {
  residents: number
  voters: number
  pendingDocuments: number
  blotterActive: number
  blotterTotal: number
  visitorsToday: number
  visitorsActive: number
  assetsTotal: number
  assetsValue: number
  meetingsToday: number
  settledCases: number
}

export interface DashboardTask {
  id: string
  priority: 'urgent' | 'normal' | 'info'
  title: string
  description: string
  link: string
}

export interface DashboardData {
  user: AuthUser | null
  timeGreeting: string
  stats: DashboardStats
  tasks: DashboardTask[]
  recentActivity: ApiActivity[]
  loading: boolean
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang umaga'
  if (hour < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

function formatDate(): string {
  const d = new Date()
  const months = ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre']
  return `Ika-${d.getDate()} ng ${months[d.getMonth()]}, ${d.getFullYear()}`
}

function buildTasksByRole(role: Role, stats: DashboardStats, _activities: ApiActivity[]): DashboardTask[] {
  const tasks: DashboardTask[] = []

  if (role === 'admin') {
    if (stats.pendingDocuments > 0) {
      tasks.push({
        id: 'pending-docs',
        priority: 'urgent',
        title: `${stats.pendingDocuments} document request${stats.pendingDocuments > 1 ? 's' : ''} pending release`,
        description: 'Mga dokumentong naghihintay ng pag-release',
        link: '/documents',
      })
    }
    if (stats.blotterActive > 0) {
      tasks.push({
        id: 'active-blotter',
        priority: 'normal',
        title: `${stats.blotterActive} active blotter case${stats.blotterActive > 1 ? 's' : ''}`,
        description: 'Mga kasong nangangailangan ng aksyon',
        link: '/records',
      })
    }
    tasks.push({
      id: 'assets',
      priority: 'info',
      title: `${stats.assetsTotal} assets tracked`,
      description: `Kabuuang halaga: ₱${stats.assetsValue.toLocaleString()}`,
      link: '/assets',
    })
  } else if (role === 'staff') {
    if (stats.pendingDocuments > 0) {
      tasks.push({
        id: 'pending-docs',
        priority: 'urgent',
        title: `${stats.pendingDocuments} document request${stats.pendingDocuments > 1 ? 's' : ''} to process`,
        description: 'Nakapila para sa pagproseso',
        link: '/documents',
      })
    }
    if (stats.blotterActive > 0) {
      tasks.push({
        id: 'active-blotter',
        priority: 'normal',
        title: `${stats.blotterActive} blotter case${stats.blotterActive > 1 ? 's' : ''} to attend to`,
        description: 'Nakabinbing kaso para sa hearing o settlement',
        link: '/records',
      })
    }
    if (stats.visitorsActive > 0) {
      tasks.push({
        id: 'visitors',
        priority: 'normal',
        title: `${stats.visitorsActive} visitor${stats.visitorsActive > 1 ? 's' : ''} currently on-site`,
        description: 'Mga bisita na hindi pa naka-check out',
        link: '/logs/visitors',
      })
    }
  } else {
    tasks.push({
      id: 'reports',
      priority: 'info',
      title: `${stats.residents} residents registered`,
      description: 'Kabuuang bilang ng mga mamamayan ng barangay',
      link: '/reports',
    })
    tasks.push({
      id: 'records-browse',
      priority: 'info',
      title: `${stats.blotterTotal} blotter cases on record`,
      description: 'Tingnan ang mga tala ng kaso',
      link: '/records',
    })
  }

  return tasks
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    user: null,
    timeGreeting: '',
    stats: {
      residents: 0, voters: 0, pendingDocuments: 0, blotterActive: 0, blotterTotal: 0,
      visitorsToday: 0, visitorsActive: 0, assetsTotal: 0, assetsValue: 0,
      meetingsToday: 0, settledCases: 0,
    },
    tasks: [],
    recentActivity: [],
    loading: true,
  })

  useEffect(() => {
    const user = getCurrentUser()

    Promise.all([
      getResidentsSummary().catch(() => ({ total: 0, voters: 0, seniors: 0, pwd: 0 })),
      getBlottersSummary().catch(() => ({ total: 0, pending: 0, hearing: 0, settled: 0, escalated: 0, dismissed: 0 })),
      getDocumentsReport().catch(() => ({ total: 0, byStatus: {}, byType: {}, todayRequests: 0 })),
      getVisitorsReport().catch(() => ({ total: 0, activeVisits: 0, byPurpose: {} })),
      getAssetsReport().catch(() => ({ total: 0, byType: {}, byCondition: {}, byStatus: {}, totalValue: 0 })),
      getActivities(1, 10).catch(() => ({ items: [], totalItems: 0, totalPages: 0 })),
    ]).then(([res, blot, docs, vis, assets, activity]) => {
      const stats: DashboardStats = {
        residents: res.total,
        voters: res.voters,
        pendingDocuments: docs.byStatus['pending'] ?? 0,
        blotterActive: (blot.pending ?? 0) + (blot.hearing ?? 0),
        blotterTotal: blot.total,
        visitorsToday: vis.total,
        visitorsActive: vis.activeVisits,
        assetsTotal: assets.total,
        assetsValue: assets.totalValue,
        meetingsToday: 0,
        settledCases: blot.settled ?? 0,
      }

      setData({
        user,
        timeGreeting: getTimeGreeting(),
        stats,
        tasks: user ? buildTasksByRole(user.role, stats, activity.items) : [],
        recentActivity: activity.items,
        loading: false,
      })
    })
  }, [])

  return data
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/hooks/useDashboardData.ts
git commit -m "feat: add useDashboardData hook"
```

---

### Task 6: Build Dashboard hero greeting section

**Files:**
- Modify: `src/pages/Dashboard.tsx` (start building)
- New helper: `src/pages/DashboardHero.tsx` (modular component)

- [ ] **Step 1: Create DashboardHero component**

```tsx
import { getCurrentUser } from '@/auth/session'
import { Users, FileText, Scale } from 'lucide-react'
import type { DashboardStats } from './hooks/useDashboardData'

function formatDate(): string {
  const d = new Date()
  const months = ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre']
  return `Ika-${d.getDate()} ng ${months[d.getMonth()]}, ${d.getFullYear()}`
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang umaga'
  if (hour < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

interface DashboardHeroProps {
  userName: string
  role: string
  stats: DashboardStats
}

export default function DashboardHero({ userName, role, stats }: DashboardHeroProps) {
  const pills = [
    { label: 'Kabuuang Residente', value: stats.residents, icon: Users },
    { label: 'Nakabinbing Dokumento', value: stats.pendingDocuments, icon: FileText },
    { label: 'Aktibong Kaso', value: stats.blotterActive, icon: Scale },
  ]

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-barangay to-narra p-6 text-white shadow-lg motion-fade-in motion-slide-up">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />
      <div className="relative">
        <h1 className="text-2xl font-bold tracking-tight">
          {getTimeGreeting()}, {userName}!
        </h1>
        <p className="mt-1 text-sm text-white/70">{formatDate()}</p>
        <div className="mt-1">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-0.5 text-xs font-medium capitalize backdrop-blur-sm">
            {role}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {pills.map((pill) => {
            const Icon = pill.icon
            return (
              <div key={pill.label} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                <Icon className="size-4 text-gold" />
                <div>
                  <p className="text-lg font-bold leading-none">{pill.value}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">{pill.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire it into Dashboard.tsx (partial)**

Import and render `DashboardHero` at the top of the dashboard page.

- [ ] **Step 3: Commit**

```bash
git add src/pages/DashboardHero.tsx src/pages/Dashboard.tsx
git commit -m "feat: add dashboard hero greeting section"
```

---

### Task 7: Build Dashboard KPI grid section

**Files:**
- Create: `src/pages/DashboardKPI.tsx`

- [ ] **Step 1: Create DashboardKPI component**

```tsx
import { Users, FileText, Scale, DoorOpen, Package, Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardStats } from './hooks/useDashboardData'
import type { Role } from '@/auth/session'

interface KpiCard {
  label: string
  value: number | string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  roles: Role[]
}

interface DashboardKPIProps {
  stats: DashboardStats
  role: Role
  loading: boolean
}

export default function DashboardKPI({ stats, role, loading }: DashboardKPIProps) {
  const allCards: KpiCard[] = [
    { label: 'Residents', value: stats.residents, sub: `${stats.voters} voters`, icon: Users, color: 'text-barangay', roles: ['admin', 'staff', 'viewer'] },
    { label: 'Document Requests', value: stats.pendingDocuments, sub: 'pending', icon: FileText, color: 'text-amber-500', roles: ['admin', 'staff', 'viewer'] },
    { label: 'Blotter Cases', value: stats.blotterActive, sub: 'active', icon: Scale, color: 'text-blue-500', roles: ['admin', 'staff', 'viewer'] },
    { label: 'Visitors', value: stats.visitorsToday, sub: `${stats.visitorsActive} now`, icon: DoorOpen, color: 'text-emerald-500', roles: ['admin', 'staff'] },
    { label: 'Meetings Today', value: stats.meetingsToday, sub: 'today', icon: Calendar, color: 'text-purple-500', roles: ['admin', 'staff'] },
    { label: 'Assets', value: `₱${(stats.assetsValue / 1000).toFixed(1)}K`, sub: `${stats.assetsTotal} items`, icon: Package, color: 'text-narra', roles: ['admin'] },
    { label: 'Settled Cases', value: stats.settledCases, sub: 'total', icon: CheckCircle2, color: 'text-emerald-500', roles: ['admin', 'staff'] },
    { label: 'Pending Documents', value: stats.pendingDocuments, sub: 'for release', icon: Clock, color: 'text-orange-500', roles: ['admin'] },
  ]

  const visibleCards = allCards.filter((card) => card.roles.includes(role))

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 motion-stagger-75">
      {visibleCards.map((card, i) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="overflow-hidden motion-lift" style={{ ['--stagger-index' as string]: i }}>
            <div className="h-1 w-full bg-gold/60" />
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">{card.sub}</p>
                  </div>
                  <Icon className={cn('size-5 shrink-0 mt-0.5', card.color)} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Wire into Dashboard.tsx**

Import and render `DashboardKPI` below the hero.

- [ ] **Step 3: Commit**

```bash
git add src/pages/DashboardKPI.tsx src/pages/Dashboard.tsx
git commit -m "feat: add dashboard KPI grid section"
```

---

### Task 8: Build Dashboard tasks + activity sections

**Files:**
- Create: `src/pages/DashboardTasks.tsx`
- Create: `src/pages/DashboardActivity.tsx`

- [ ] **Step 1: Create DashboardTasks component**

```tsx
import { Link } from 'react-router'
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DashboardTask } from './hooks/useDashboardData'

interface DashboardTasksProps {
  tasks: DashboardTask[]
}

const priorityConfig = {
  urgent: { icon: AlertCircle, color: 'text-red-pinoy', bg: 'bg-red-50 dark:bg-red-500/10' },
  normal: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
}

export default function DashboardTasks({ tasks }: DashboardTasksProps) {
  return (
    <Card className="motion-fade-in motion-slide-up">
      <CardContent className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          Ang Iyong mga Gawain
          <span className="text-[10px] font-normal text-muted-foreground/60">Ngayong araw</span>
        </h2>

        {tasks.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle className="size-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Maayos ang lahat!</p>
            <p className="text-xs text-muted-foreground/60">Walang nakabinbing gawain.</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {tasks.map((task) => {
              const cfg = priorityConfig[task.priority]
              const Icon = cfg.icon
              return (
                <li key={task.id}>
                  <Link to={task.link} className="flex items-start gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-accent">
                    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', cfg.bg)}>
                      <Icon className={cn('size-4', cfg.color)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">{task.description}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {tasks.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <Link to="/records">
              <Button variant="ghost" size="sm" className="w-full text-xs">Tingnan Lahat</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

Note: Add `import { CheckCircle } from 'lucide-react'` at the top.

- [ ] **Step 2: Create DashboardActivity component**

```tsx
import { Link } from 'react-router'
import { Clock, FileText, Users, DoorOpen, Package, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ApiActivity } from '@/api/activity'
import type { Role } from '@/auth/session'

const collectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  blotter_records: FileText,
  residents: Users,
  document_requests: FileText,
  visitors: DoorOpen,
  assets: Package,
  meetings: Calendar,
}

interface DashboardActivityProps {
  activities: ApiActivity[]
  role: Role
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ngayon lang'
  if (mins < 60) return `${mins}m ang nakalipas`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} oras ang nakalipas`
  const days = Math.floor(hours / 24)
  return `${days} araw ang nakalipas`
}

export default function DashboardActivity({ activities, role }: DashboardActivityProps) {
  return (
    <Card className="motion-fade-in motion-slide-up" style={{ animationDelay: '100ms' }}>
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Mga Kamakailang Gawain</h2>

        {activities.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground/60">
                    Wala pang naitalang aktibidad.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {activities.slice(0, 10).map((act) => {
                      const Icon = collectionIcons[act.collection] ?? Clock
                      return (
                        <li key={act.id} className="flex items-start gap-3 text-sm">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                            <Icon className="size-3.5 text-muted-foreground" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-foreground">{act.details}</p>
                            <p className="text-xs text-muted-foreground/60">
                              {act.user_name} — {timeAgo(act.created)}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}

                <div className="mt-3 border-t pt-3">
                  <Link to="/logs/activity">
                    <Button variant="ghost" size="sm" className="w-full text-xs">Tingnan Lahat ng Aktibidad</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        }
        ```

        - [ ] **Step 3: Create DashboardQuickActions component**

        ```tsx
        import { Link } from 'react-router'
        import { FileText, Users, DoorOpen, Calendar } from 'lucide-react'
        import { Card, CardContent } from '@/components/ui/card'
        import { Button } from '@/components/ui/button'
        import type { Role } from '@/auth/session'

        interface DashboardQuickActionsProps {
          role: Role
        }

        const actionsByRole: Record<Role, { label: string; to: string; icon: React.ComponentType<{ className?: string }> }[]> = {
          admin: [
            { label: 'New Document Request', to: '/documents', icon: FileText },
            { label: 'New Blotter Record', to: '/records', icon: FileText },
            { label: 'New Resident', to: '/residents', icon: Users },
            { label: 'Schedule Meeting', to: '/agenda', icon: Calendar },
          ],
          staff: [
            { label: 'New Blotter Record', to: '/records', icon: FileText },
            { label: 'New Document Request', to: '/documents', icon: FileText },
            { label: 'Log Visitor', to: '/logs/visitors', icon: DoorOpen },
          ],
          viewer: [
            { label: 'Browse Residents', to: '/residents', icon: Users },
            { label: 'View Reports', to: '/reports', icon: FileText },
          ],
        }

        export default function DashboardQuickActions({ role }: DashboardQuickActionsProps) {
          const actions = actionsByRole[role] ?? []

          return (
            <Card className="motion-fade-in motion-slide-up" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-foreground">Mabilis na Access</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {actions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link key={action.to + action.label} to={action.to} className="block">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 motion-press">
                          <Icon className="size-4" />
                          {action.label}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        }
        ```

        - [ ] **Step 4: Commit**

        ```bash
        git add src/pages/DashboardTasks.tsx src/pages/DashboardActivity.tsx src/pages/DashboardQuickActions.tsx
        git commit -m "feat: add dashboard tasks, activity, and quick actions sections"
        ```

        ---

        ### Task 9: Wire up complete Dashboard page

        **Files:**
        - Modify: `src/pages/Dashboard.tsx` (full rewrite)

        - [ ] **Step 1: Rewrite Dashboard.tsx**

        ```tsx
        import { useDashboardData } from './hooks/useDashboardData'
        import DashboardHero from './DashboardHero'
        import DashboardKPI from './DashboardKPI'
        import DashboardTasks from './DashboardTasks'
        import DashboardActivity from './DashboardActivity'
        import DashboardQuickActions from './DashboardQuickActions'

        export default function Dashboard() {
          const { user, timeGreeting, stats, tasks, recentActivity, loading } = useDashboardData()
          const role = user?.role ?? 'viewer'

          return (
            <div className="space-y-6">
              {user && (
                <DashboardHero
                  userName={user.name ?? user.email}
                  role={user.role}
                  stats={stats}
                />
              )}

              <DashboardKPI stats={stats} role={role} loading={loading} />

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <DashboardTasks tasks={tasks} />
                </div>
                <div className="space-y-6">
                  <DashboardQuickActions role={role} />
                  <DashboardActivity activities={recentActivity} role={role} />
                </div>
              </div>
            </div>
          )
        }
        ```

        - [ ] **Step 2: Commit**

        ```bash
        git add src/pages/Dashboard.tsx
        git commit -m "feat: wire up complete redesigned dashboard"
        ```

        ---

        ### Task 10: Apply lazy pagination to feature pages

        **Files:**
        - Modify: feature page files that list records

        Select the feature pages that are "data heavy" — those that use `getFullList()` today. Replace with `getList(page, perPage)` and render `Pagination` component.

        Typical pattern for each page:

        **Before:**
        ```ts
        const all = await getBlotters()
        // or
        const all = await getClient().collection('records').getFullList()
        ```

        **After:**
        ```ts
        const [page, setPage] = useState(1)
        const perPage = 25
        const result = await getClient().collection('records').getList(page, perPage, { sort: '-created' })
        // result.items, result.totalItems, result.totalPages

        // In JSX:
        <Pagination page={page} totalPages={result.totalPages} totalItems={result.totalItems} onPageChange={setPage} />
        ```

        Apply to:
        - `src/features/records/` (Blotter Records)
        - `src/features/residents/` (Resident Profiles)
        - `src/features/households/` (Households)
        - `src/features/documents/` (Document Queue)
        - `src/features/logs/ActivityPage.tsx`
        - `src/features/logs/VisitorLogPage.tsx`
        - `src/features/assets/` (Assets)
        - `src/features/agenda/` (Agenda & Minutes)

        - [ ] **Step 1: Apply pagination to Blotter Records**

        - [ ] **Step 2: Apply pagination to Residents**

        - [ ] **Step 3: Apply pagination to remaining pages**

        - [ ] **Step 4: Commit**

        ```bash
        git add src/features/records/ src/features/residents/ src/features/documents/ src/features/households/ src/features/logs/ src/features/assets/ src/features/agenda/
        git commit -m "feat: add lazy pagination to all data-heavy tables"
        ```
