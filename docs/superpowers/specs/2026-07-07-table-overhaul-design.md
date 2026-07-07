# Table Overhaul Design

**Date:** 2026-07-07
**Status:** Approved

## Problem

The existing `DataTable` component is functional but lacks modern table features: column filtering, row selection, sticky headers, export, compact mode, and polished visuals. It relies on parents to manually manage sorting, pagination, and filtered state — repetitive code across 14 table instances.

## Approach

Wrap `@tanstack/react-table` (headless) inside the existing `DataTable<T>` component, keeping the public `Column<T>` / `DataTableProps<T>` API largely intact. All visual polish is applied via Tailwind CSS — no theme conflicts.

## New Dependency

- `@tanstack/react-table` — headless table state management

## Files

### Modified
- `src/components/ui/data-table.tsx` — rewrite internals with TanStack, extend API
- `src/components/ui/Pagination.tsx` — minor compatibility adjustments
- `src/components/ui/empty-state.tsx` — more visual empty states
- 14 feature page files — add column filter configs, optional selection handler, remove manual sort/paginate code

### New
- `src/components/ui/data-table-toolbar.tsx` — toolbar (export, column visibility, dense toggle, selection count)

## API

```typescript
interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  hideBelow?: 'sm' | 'md' | 'lg'
  className?: string
  // NEW
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
  // KEPT (now optional — DataTable handles internally; if omitted, DataTable manages its own sort state)
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  page?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onRowClick?: (item: T) => void
  // NEW
  onSelectionChange?: (selectedKeys: string[]) => void
  dense?: boolean
  exportable?: boolean
  toolbar?: boolean
}
```

## Data Flow

```
Parent fetches → external filters applied → filteredData
  → <DataTable data={filteredData} ... />
    → TanStack manages: column filters, sorting, pagination, selection
    → Reports selection changes via onSelectionChange
    → Renders: toolbar → sticky header → filter row → tbody → pagination
```

## Visual Design

| Element | Style |
|---|---|
| Header | Sticky, `bg-card` with scroll shadow. `text-xs font-semibold uppercase tracking-wider text-muted-foreground` |
| Sort | Animated chevron, visible only when active |
| Filter row | Thin inputs/selects below header, `h-8 text-xs` |
| Body rows | `border-b border-border/60`, `even:bg-muted/30` zebra |
| Hover | `hover:bg-accent/40` + subtle shadow |
| Selected | `bg-gold/10 ring-1 ring-gold/30` |
| Resize handle | 1px vertical line, visible on header hover |
| Pinned | `sticky` with `z-10` and shadow border |
| Animations | Staggered `motion-slide-up` row entrance |
| Dense | `py-1.5 px-2 text-xs` vs default `py-3 px-3 text-sm` |

**Row selection**: Ctrl+Left Click toggles a row's selected state (does not fire `onRowClick`). Selection state tracked internally, reported via `onSelectionChange(selectedKeys)`. No checkbox column — selection is opt-in via modifier key.

Mobile cards retain existing layout with refined shadows, spacing, and entrance animations.

## States

| State | Handling |
|---|---|
| Loading | Shimmer skeleton with `motion-stagger` |
| Empty (no data) | Refined EmptyState with icon |
| Empty (filtered out) | "No matches" with "Clear filters" button |
| Export error | Sonner toast |
| Export format | CSV (built-in download); XLSX optionally uses existing ExcelJS |
| Column filter conflict | Falls into empty filtered state |

## Testing

- Update `data-table.test.tsx`: column filtering, row selection (Ctrl+Click), dense mode, export button render, pinned columns, filter reset
- Framework: Vitest + Testing Library (existing)
