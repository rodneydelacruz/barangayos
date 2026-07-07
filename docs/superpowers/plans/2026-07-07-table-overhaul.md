# Table Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the custom `DataTable` component with TanStack Table + full visual overhaul, adding column filtering, row selection, sticky headers, export, dense mode, and animations.

**Architecture:** Wrap `@tanstack/react-table` inside the existing `DataTable<T>` component. Keep the public `Column<T>` and `DataTableProps<T>` API mostly intact (extend with new features, keep old sort/pagination props as optional). All visual polish via Tailwind — no theme conflicts.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, @tanstack/react-table, ExcelJS (existing), Lucide icons

## Global Constraints

- No auto-commits to git — user commits manually at end
- No third-party table UI library (TanStack is headless, only provides logic)
- Keep backward compat: existing pages must still work without changes
- Follow existing Philippine theme colors (barangay, gold, narra, bamboo, capiz)
- Use existing `motion-*` utility classes for animations

---

### Task 1: Install dependency + Create DataTableToolbar

**Files:**
- Modify: `package.json`
- Create: `src/components/ui/data-table-toolbar.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: `DataTableToolbar` component used by Task 2

- [ ] **Step 1: Install @tanstack/react-table**

Run: `npm install @tanstack/react-table`

- [ ] **Step 2: Create data-table-toolbar.tsx**

```tsx
import { type ReactNode } from 'react'
import { Download, Columns, Compress, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ToolbarColumn {
  key: string
  label: string
  visible: boolean
}

interface DataTableToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onExport: () => void
  dense: boolean
  onDenseToggle: () => void
  columns: ToolbarColumn[]
  onColumnVisibilityChange: (key: string, visible: boolean) => void
  className?: string
}

export function DataTableToolbar({
  selectedCount, onClearSelection, onExport, dense, onDenseToggle,
  columns, onColumnVisibilityChange, className,
}: DataTableToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2 px-2 py-2', className)}>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold">
            <span>{selectedCount} selected</span>
            <button type="button" onClick={onClearSelection} className="hover:text-foreground">
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onDenseToggle} title="Toggle dense mode">
          <Compress className="size-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport} title="Export to CSV">
          <Download className="size-3.5" />
        </Button>
        <div className="relative group">
          <Button variant="ghost" size="sm" title="Toggle columns">
            <Columns className="size-3.5" />
          </Button>
          <div className="absolute right-0 top-full z-50 mt-1 hidden min-w-36 rounded-md border bg-card p-1.5 shadow-lg group-hover:block">
            {columns.map((col) => (
              <label key={col.key} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={(e) => onColumnVisibilityChange(col.key, e.target.checked)}
                  className="size-3"
                />
                {col.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify no build errors**

Run: `npx tsc --noEmit`

---

### Task 2: Rewrite DataTable core with TanStack

**Files:**
- Modify: `src/components/ui/data-table.tsx` (full rewrite)

**Interfaces:**
- Consumes: `DataTableToolbar` from Task 1, `Pagination` (existing, minor adjustments in Task 3)
- Produces: Updated `DataTable<T>` component used by all feature pages

- [ ] **Step 1: Write the new data-table.tsx**

Replace entire file with TanStack-powered implementation:

```tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { type ReactNode } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Row,
  type OnChangeFn,
  flexRender,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Pagination from '@/components/ui/Pagination'
import { DataTableToolbar, type ToolbarColumn } from './data-table-toolbar'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  hideBelow?: 'sm' | 'md' | 'lg'
  className?: string
  filterType?: 'text' | 'select' | 'date'
  filterOptions?: { label: string; value: string }[]
  pinned?: 'left' | 'right'
  resizable?: boolean
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyState?: ReactNode
  rowKey: (item: T) => string
  onRowClick?: (item: T) => void
  onSelectionChange?: (selectedKeys: string[]) => void
  dense?: boolean
  exportable?: boolean
  toolbar?: boolean
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  page?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  pageSize?: number
}

export function DataTable<T>({
  columns, data, loading, emptyState, rowKey, onRowClick,
  onSelectionChange, dense = false, exportable = false, toolbar = true,
  sortKey: externalSortKey, sortDir: externalSortDir, onSort: externalOnSort,
  page: externalPage, totalPages: externalTotalPages, totalItems: externalTotalItems,
  onPageChange: externalOnPageChange, pageSize: externalPageSize = 25,
}: DataTableProps<T>) {
  const tanColumns: ColumnDef<T>[] = useMemo(() =>
    columns.map(col => ({
      id: col.key,
      header: () => (
        <div className={cn('flex items-center gap-1', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
          {col.label}
        </div>
      ),
      cell: (info) => {
        const rendered = col.render ? col.render(info.row.original) : String(info.getValue() ?? '')
        return <div className={cn(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>{rendered}</div>
      },
      accessorFn: (row) => (row as Record<string, unknown>)[col.key],
      enableSorting: col.sortable ?? false,
      enableColumnFilter: !!col.filterType,
      filterFn: col.filterType === 'select' ? 'equalsString' : 'includesString',
      meta: { hideBelow: col.hideBelow, className: col.className, pinned: col.pinned, filterType: col.filterType, filterOptions: col.filterOptions, align: col.align },
    })), [columns])

  const isControlled = !!externalSortKey
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [internalDense, setInternalDense] = useState(dense)

  const sorting = isControlled
    ? externalSortKey ? [{ id: externalSortKey, desc: externalSortDir === 'desc' }] : []
    : internalSorting

  const onSortingChange: OnChangeFn<SortingState> = useCallback((updater) => {
    if (isControlled && externalOnSort) {
      const newState = typeof updater === 'function' ? updater(sorting) : updater
      if (newState.length > 0) {
        externalOnSort(newState[0].id)
      }
    } else {
      setInternalSorting(updater)
    }
  }, [isControlled, externalOnSort, sorting])

  const pageCount = externalTotalPages ?? Math.ceil(data.length / externalPageSize)

  const table = useReactTable({
    data,
    columns: tanColumns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination: externalOnPageChange
        ? { pageIndex: (externalPage ?? 1) - 1, pageSize: externalPageSize }
        : { pageIndex: 0, pageSize: externalPageSize },
    },
    onSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: externalOnPageChange ? undefined : getPaginationRowModel(),
    getRowId: (row) => rowKey(row),
    enableRowSelection: !!onSelectionChange,
    enableSortingRemoval: false,
    manualPagination: !!externalOnPageChange,
    pageCount: externalOnPageChange ? pageCount : undefined,
  })

  useEffect(() => {
    if (onSelectionChange) {
      const keys = table.getSelectedRowModel().rows.map(r => r.id)
      onSelectionChange(keys)
    }
  }, [rowSelection])

  useEffect(() => {
    setInternalDense(dense)
  }, [dense])

  function handleRowClick(e: React.MouseEvent, row: Row<T>) {
    if ((e.ctrlKey || e.metaKey) && onSelectionChange) {
      row.toggleSelected()
    } else if (onRowClick) {
      onRowClick(row.original)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, row: Row<T>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (onRowClick) onRowClick(row.original)
    }
  }

  function handleExport() {
    const rows = table.getFilteredRowModel().rows
    const headers = columns.map(c => c.label)
    const csvRows = [headers.join(',')]
    for (const row of rows) {
      const vals = columns.map(c => {
        let val: unknown
        if (c.render) {
          val = (row.original as Record<string, unknown>)[c.key]
        } else {
          val = (row.original as Record<string, unknown>)[c.key]
        }
        const str = String(val ?? '')
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      })
      csvRows.push(vals.join(','))
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'export.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function getFilterComponent(column: Column<T>, tableCol: unknown) {
    const tanCol = table.getColumn(column.key)
    if (!tanCol || !column.filterType) return null
    const value = (tanCol.getFilterValue() ?? '') as string

    if (column.filterType === 'select' && column.filterOptions) {
      return (
        <select
          value={value}
          onChange={(e) => tanCol.setFilterValue(e.target.value || undefined)}
          className="h-7 w-full rounded border border-border/50 bg-transparent px-1 text-[11px] text-muted-foreground outline-none focus:border-ring"
        >
          <option value="">All</option>
          {column.filterOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    }
    if (column.filterType === 'date') {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => tanCol.setFilterValue(e.target.value || undefined)}
          className="h-7 w-full rounded border border-border/50 bg-transparent px-1 text-[11px] text-muted-foreground outline-none focus:border-ring"
        />
      )
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => tanCol.setFilterValue(e.target.value || undefined)}
        placeholder="Filter..."
        className="h-7 w-full rounded border border-border/50 bg-transparent px-1 text-[11px] text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring"
      />
    )
  }

  const visibleColumns = columns.filter(c => !columnHidden[c.key])
  const [columnHidden, setColumnHidden] = useState<Record<string, boolean>>({})

  const toolbarColumns: ToolbarColumn[] = columns.map(c => ({
    key: c.key, label: c.label, visible: !columnHidden[c.key],
  }))

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            {columns.map((col) => (
              <div key={col.key} className="h-4 animate-pulse rounded bg-muted flex-1" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return emptyState ? <div>{emptyState}</div> : null
  }

  const displayRows = table.getRowModel().rows
  const showFilters = columns.some(c => c.filterType)

  return (
    <div>
      {toolbar && (
        <DataTableToolbar
          selectedCount={table.getSelectedRowModel().rows.length}
          onClearSelection={() => table.resetRowSelection()}
          onExport={handleExport}
          dense={internalDense}
          onDenseToggle={() => setInternalDense(d => !d)}
          columns={toolbarColumns}
          onColumnVisibilityChange={(key, visible) => setColumnHidden(h => ({ ...h, [key]: !visible }))}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0] shadow-border/60">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => {
                  const meta = h.column.columnDef.meta as Record<string, unknown> | undefined
                  const colDef = columns.find(c => c.key === h.id)
                  if (columnHidden[h.id]) return null
                  const canSort = h.column.getCanSort()
                  const sorted = h.column.getIsSorted()
                  return (
                    <th
                      key={h.id}
                      className={cn(
                        'py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                        canSort && 'cursor-pointer select-none hover:text-foreground',
                        meta?.pinned === 'left' && 'sticky left-0 z-10 bg-card shadow-[2px_0_4px_-2px] shadow-border/30',
                        meta?.pinned === 'right' && 'sticky right-0 z-10 bg-card shadow-[-2px_0_4px_-2px] shadow-border/30',
                        colDef?.hideBelow && `hidden ${colDef.hideBelow}:table-cell`,
                        colDef?.className,
                      )}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                      style={{ width: h.getSize(), minWidth: colDef?.resizable ? 80 : undefined }}
                      aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {sorted && (
                        sorted === 'asc' ? <ChevronUp className="ml-0.5 inline size-3" /> : <ChevronDown className="ml-0.5 inline size-3" />
                      )}
                      {colDef?.resizable && (
                        <div
                          onMouseDown={h.getResizeHandler()}
                          onTouchStart={h.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-border"
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
            {showFilters && (
              <tr className="border-b border-border/60">
                {table.getVisibleLeafColumns().map(col => {
                  const colDef = columns.find(c => c.key === col.id)
                  if (columnHidden[col.id]) return null
                  return (
                    <th key={col.id} className={cn('px-3 py-1', colDef?.hideBelow && `hidden ${colDef.hideBelow}:table-cell`)}>
                      {colDef?.filterType && getFilterComponent(colDef, col)}
                    </th>
                  )
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr
                key={row.id}
                onClick={(e) => handleRowClick(e, row)}
                onKeyDown={(e) => handleKeyDown(e, row)}
                tabIndex={onRowClick || onSelectionChange ? 0 : undefined}
                role={onRowClick || onSelectionChange ? 'button' : undefined}
                className={cn(
                  'border-b border-border/60 even:bg-muted/30 transition-all duration-150',
                  'motion-slide-up',
                  'hover:bg-accent/40 hover:shadow-sm',
                  row.getIsSelected() && 'bg-gold/10 ring-1 ring-inset ring-gold/30',
                  (onRowClick || onSelectionChange) && 'cursor-pointer',
                  internalDense ? 'py-1.5' : 'py-3',
                )}
                style={{ animationDelay: `${(i % 25) * 30}ms` }}
              >
                {row.getVisibleCells().map(cell => {
                  const colDef = columns.find(c => c.key === cell.column.id)
                  if (columnHidden[cell.column.id]) return null
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-3',
                        internalDense ? 'py-1.5 text-xs' : 'py-3 text-sm',
                        colDef?.hideBelow && `hidden ${colDef.hideBelow}:table-cell`,
                        colDef?.className,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={externalPage ?? table.getState().pagination.pageIndex + 1}
        totalPages={externalTotalPages ?? table.getPageCount()}
        totalItems={externalTotalItems ?? table.getFilteredRowModel().rows.length}
        onPageChange={(p) => {
          if (externalOnPageChange) {
            externalOnPageChange(p)
          } else {
            table.setPageIndex(p - 1)
          }
        }}
        pageSize={externalPageSize}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify no build errors**

Run: `npx tsc --noEmit`
Expected: Type errors related to `meta` type (add `declare module '@tanstack/react-table'` augmentation if needed), Pagination import compatibility

- [ ] **Step 3: Fix type issues**

If TanStack's `ColumnDef.meta` type is too strict, add module augmentation at top of file or in a `.d.ts`:

```typescript
declare module '@tanstack/react-table' {
  interface ColumnMeta {
    hideBelow?: string
    className?: string
    pinned?: string
    filterType?: string
    filterOptions?: { label: string; value: string }[]
    align?: string
  }
}
```

---

### Task 3: Update Pagination

**Files:**
- Modify: `src/components/ui/Pagination.tsx`

- [ ] **Step 1: Ensure Pagination accepts page 0 gracefully**

TanStack pagination is 0-indexed but the existing Pagination component and all feature pages use 1-indexed page numbers. The Task 2 code already converts: `externalPage ?? table.getState().pagination.pageIndex + 1`. So Pagination itself should still receive 1-indexed pages. Verify Pagination handles `page=1` correctly when no data exists (totalPages could be 0):

```typescript
// Add to top of Pagination component:
if (totalPages <= 0 || totalItems === 0) return null
```

---

### Task 4: Update ResidentsPage + HouseholdsPage

**Files:**
- Modify: `src/features/residents/ResidentsPage.tsx`
- Modify: `src/features/households/HouseholdsPage.tsx`

For each page:

- [ ] **Step 1: Add `filterType` and `filterOptions` to column definitions**

In ResidentsPage, update columns:
```typescript
{ key: 'last_name', label: 'Name', sortable: true, filterType: 'text',
  render: (r) => `${r.last_name}, ${r.first_name}${r.middle_name ? ' ' + r.middle_name : ''}` },
{ key: 'purok', label: 'Purok', sortable: true, hideBelow: 'sm', filterType: 'select',
  filterOptions: purokOptions.map(p => ({ label: p, value: p })) },
{ key: 'gender', label: 'Gender', hideBelow: 'sm', filterType: 'select',
  filterOptions: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
{ key: 'birth_date', label: 'Age', render: ..., hideBelow: 'md' },
{ key: 'civil_status', label: 'Civil Status', hideBelow: 'md', filterType: 'select',
  filterOptions: [
    { label: 'Single', value: 'single' }, { label: 'Married', value: 'married' },
    { label: 'Widowed', value: 'widowed' }, { label: 'Separated', value: 'separated' },
  ] },
{ key: 'tags', label: 'Tags', render: ... },
```

- [ ] **Step 2: Remove manual sort/paginate state (optional)**

Remove `sortKey`, `sortDir`, `handleSort`, `page` (unless also used externally), `PAGE_SIZE`, `totalPages`, `paginatedResidents`. Remove sort from `filteredResidents` useMemo.

Update `<DataTable>` to remove old sort/pagination props, add new ones:
```tsx
<DataTable
  columns={columns}
  data={filteredResidents}
  loading={loading}
  onRowClick={(r) => openFlyout(r)}
  emptyState={...}
  rowKey={(r) => r.id}
  onSelectionChange={handleResidentSelection}
  exportable
  toolbar
/>
```

- [ ] **Step 3: Repeat identical pattern for HouseholdsPage**

Add filterType/select to columns like `purok`, `household_number`, `head_name`.

---

### Task 5: Update RecordsPage + DocumentsPage + ReleasePage

**Files:**
- Modify: `src/features/records/RecordsPage.tsx`
- Modify: `src/features/documents/DocumentsPage.tsx`
- Modify: `src/features/documents/ReleasePage.tsx`

- [ ] **Step 1: RecordsPage** — add filterType to columns:
  - `case_number`: text filter
  - `complainant_name`, `respondent_name`: text filter
  - `type`: select filter (blotter types)
  - `status`: select filter (settled, hearing, dismissed, etc.)

- [ ] **Step 2: DocumentsPage** — add filterType:
  - `queue_number`: text filter
  - `resident_name`: text filter
  - `document_type`: select filter
  - `status`: select filter (released, for_release, processing, etc.)

- [ ] **Step 3: ReleasePage** — add filterType:
  - `control_number`: text
  - `resident_name`: text
  - `document_type`: select
  - `status`: select

---

### Task 6: Update AssetsPage + AgendaPage

**Files:**
- Modify: `src/features/assets/AssetsPage.tsx`
- Modify: `src/features/agenda/AgendaPage.tsx`

- [ ] **Step 1: AssetsPage** — add filterType:
  - `name`: text
  - `type`: select (equipment, furniture, vehicle, etc.)
  - `condition`: select (good, fair, poor)
  - `status`: select (available, assigned, disposed)

- [ ] **Step 2: AgendaPage** — two tables. Add filterType to both.

---

### Task 7: Update ActivityPage + VisitorLogPage

**Files:**
- Modify: `src/features/logs/ActivityPage.tsx`
- Modify: `src/features/logs/VisitorLogPage.tsx`

- [ ] **Step 1: ActivityPage** — add filterType:
  - `action`: select (create, update, delete)
  - `collection`: select
  - `user`: text

- [ ] **Step 2: VisitorLogPage** — add filterType:
  - `name`: text
  - `purpose`: text
  - `status`: select (checked_in, checked_out)

---

### Task 8: Update Finance pages

**Files:**
- Modify: `src/features/finance/RevenueTracking.tsx`
- Modify: `src/features/finance/FundSources.tsx`
- Modify: `src/features/finance/Disbursements.tsx`
- Modify: `src/features/finance/Appropriations.tsx`
- Modify: `src/features/finance/FinanceAudit.tsx`

- [ ] **Step 1: RevenueTracking** — add filterType:
  - `category`: select with CATEGORIES
  - `source`: text
  - `amount`: text
  - `or_no`: text

- [ ] **Step 2: FundSources, Disbursements, Appropriations, FinanceAudit** — add relevant select/text filters matching their column types.

---

### Task 9: Update tests

**Files:**
- Modify: `src/components/ui/data-table.test.tsx`

- [ ] **Step 1: Update existing tests for new API**

The existing tests use `onSort` (columnheader click) and `onRowClick` — these should still work if DataTable maintains backward compat. Update to use `screen.getByRole('button')` if row role changed from `button` to `button`.

- [ ] **Step 2: Add new tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, type Column } from './data-table'

interface Item { id: string; name: string; role: string }

const columns: Column<Item>[] = [
  { key: 'name', label: 'Name', sortable: true, filterType: 'text' },
  { key: 'role', label: 'Role', filterType: 'select', filterOptions: [{ label: 'Admin', value: 'Admin' }, { label: 'Staff', value: 'Staff' }] },
]

const data: Item[] = [
  { id: '1', name: 'Alice', role: 'Admin' },
  { id: '2', name: 'Bob', role: 'Staff' },
  { id: '3', name: 'Charlie', role: 'Staff' },
]

describe('DataTable', () => {
  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} />)
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
  })

  it('shows loading skeleton', () => {
    const { container } = render(<DataTable columns={columns} data={[]} loading rowKey={(i) => i.id} />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} rowKey={(i) => i.id} emptyState={<p>No items</p>} />)
    expect(screen.getByText('No items')).toBeTruthy()
  })

  it('calls onRowClick on row click', () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} rowKey={(i) => i.id} />)
    fireEvent.click(screen.getByText('Alice'))
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it('calls onSelectionChange on Ctrl+Click', () => {
    const onSelectionChange = vi.fn()
    render(<DataTable columns={columns} data={data} onSelectionChange={onSelectionChange} rowKey={(i) => i.id} />)
    fireEvent.click(screen.getByText('Alice'), { ctrlKey: true })
    expect(onSelectionChange).toHaveBeenCalledWith(['1'])
  })

  it('filters rows by text column', () => {
    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} />)
    const filterInputs = screen.getAllByPlaceholderText('Filter...')
    fireEvent.change(filterInputs[0], { target: { value: 'Alice' } })
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.queryByText('Bob')).toBeNull()
  })

  it('filters rows by select column', () => {
    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} />)
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[selects.length - 1], { target: { value: 'Admin' } })
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.queryByText('Bob')).toBeNull()
  })

  it('shows toolbar with export/dense buttons', () => {
    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} toolbar exportable />)
    expect(screen.getByTitle('Export to CSV')).toBeTruthy()
    expect(screen.getByTitle('Toggle dense mode')).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/ui/data-table.test.tsx`
Expected: All tests pass

---

### Self-Review Checklist

- [ ] Every spec requirement maps to a task
- [ ] No "TBD", "TODO", or placeholder values
- [ ] Type/method names consistent across tasks
- [ ] All file paths are exact
