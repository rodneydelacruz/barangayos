### Task 7: Routes + sidebar

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Update routes**

Add imports:
```typescript
import { ActivityPage, VisitorLogPage } from '@/features/logs'
```

Add routes inside the ProtectedRoute layout:
```typescript
<Route
  path="logs/activity"
  element={
    <ProtectedRoute roles={['admin', 'staff']}>
      <ActivityPage />
    </ProtectedRoute>
  }
/>
<Route
  path="logs/visitors"
  element={
    <ProtectedRoute roles={['admin', 'staff']}>
      <VisitorLogPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Update sidebar**

Add `ClipboardCheck, DoorOpen` to lucide-react imports.

Add Logs nav group after Records:
```typescript
{
  label: 'Logs',
  items: [
    { to: '/logs/activity', label: 'Activity Log', icon: ClipboardCheck, roles: ['admin', 'staff'] },
    { to: '/logs/visitors', label: 'Visitor Log', icon: DoorOpen, roles: ['admin', 'staff'] },
  ],
},
```
