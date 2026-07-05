# Task 3: Routes + Sidebar

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `ReportsPage` from `@/features/reports` (Task 2)
- Produces: `/reports` route with ProtectedRoute; Reports nav group in sidebar

## Steps

### Step 1: Update `src/routes/index.tsx`

Add import at the top with other imports:
```typescript
import { ReportsPage } from '@/features/reports'
```

Add route inside `<Layout>`, after the `/records` route block (alphabetical order — `/reports` comes before `/residents`):
```typescript
<Route
  path="reports"
  element={
    <ProtectedRoute roles={['admin', 'staff']}>
      <ReportsPage />
    </ProtectedRoute>
  }
/>
```

Place it right after the `/records` route block and before `/residents`.

Current routes structure for reference — the imports section has:
```typescript
import { AssetsPage } from '@/features/assets'
import { CalendarPage } from '@/features/calendar'
import { AgendaPage } from '@/features/agenda'
```

Add `ReportsPage` import alongside these.

The route blocks currently end with `/agenda`. Add `/reports` after `/agenda` and before closing the `</Layout>` wrapper.

### Step 2: Update `src/components/Sidebar.tsx`

Add `BarChart3` to the lucide-react imports (add after `Calendar,`):
```typescript
import {
  LayoutDashboard,
  FileText,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Users,
  Home,
  ClipboardList,
  CheckSquare,
  ClipboardCheck,
  DoorOpen,
  Package,
  Calendar,
  BarChart3,
} from 'lucide-react'
```

Add Reports nav group after the closing `]` of Administration group (before the closing `]` of navGroups):
```typescript
  {
    label: 'Reports',
    items: [
      { to: '/reports', label: 'Reports Dashboard', icon: BarChart3, roles: ['admin', 'staff'] },
    ],
  },
```

The existing code ends with:
```typescript
  {
    label: 'Administration',
    items: [
      { to: '/assets', label: 'Assets', icon: Package, roles: ['admin'] },
      { to: '/settings', label: 'System Settings', icon: Settings, roles: ['admin'] },
    ],
  },
]
```

Add the Reports group right after the Administration group entry.

### Step 3: Verify build passes

Run: `npm run build`

Expected: builds cleanly, no type errors

### Step 4: Commit

```bash
git add src/routes/index.tsx src/components/Sidebar.tsx
git commit -m "feat: wire Reports Dashboard into routes and sidebar"
```
