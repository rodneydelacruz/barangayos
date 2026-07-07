import { useState, useMemo, useEffect, useCallback, useRef, memo, type ReactNode } from 'react'
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
import { DataTableToolbar } from './data-table-toolbar'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    hideBelow?: string
    className?: string
    pinned?: string
    filterType?: string
    filterOptions?: { label: string; value: string }[]
    align?: string
  }
}

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  hideBelow?: 'sm' | 'md' | 'lg'
  className?: string
  filterType?: 'text' | 'select' | 'date'
  filterOptions?: { label: string; value: string }[]
  filterValue?: (item: T) => string
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

function DataTableInner<T>({
  columns, data, loading, emptyState, rowKey, onRowClick,
  onSelectionChange, dense = true, exportable = false, toolbar = true,
  sortKey: externalSortKey, sortDir: externalSortDir, onSort: externalOnSort,
  page: externalPage, totalPages: externalTotalPages, totalItems: externalTotalItems,
  onPageChange: externalOnPageChange, pageSize: externalPageSize = 25,
}: DataTableProps<T>) {
  const tanColumns: ColumnDef<T>[] = useMemo(() =>
    columns.map(col => ({
      id: col.key,
      header: () => (
        <div className={cn(
          'flex items-center gap-1',
          col.align === 'right' && 'justify-end',
          col.align === 'center' && 'justify-center',
        )}>
          {col.label}
        </div>
      ),
      cell: (info) => {
        const rendered = col.render ? col.render(info.row.original) : String(info.getValue() ?? '')
        return (
          <div className={cn(
            col.align === 'right' && 'text-right',
            col.align === 'center' && 'text-center',
          )}>
            {rendered}
          </div>
        )
      },
      accessorFn: (row) => (row as Record<string, unknown>)[col.key],
      enableSorting: col.sortable ?? false,
      enableColumnFilter: !!col.filterType,
      filterFn: col.filterType === 'select' ? 'equalsString' : col.filterValue
        ? (row, _columnId, filterVal) => String(col.filterValue!(row.original)).toLowerCase().includes(String(filterVal).toLowerCase())
        : 'includesString',
      enableResizing: col.resizable ?? false,
      size: 150,
      minSize: col.resizable ? 80 : undefined,
      meta: {
        hideBelow: col.hideBelow,
        className: col.className,
        pinned: col.pinned,
        filterType: col.filterType,
        filterOptions: col.filterOptions,
        align: col.align,
      },
    })), [columns])

  const isControlled = externalSortKey !== undefined && externalOnSort !== undefined
  const [internalSorting, setInternalSorting] = useState<SortingState>(() =>
    !isControlled && externalSortKey !== undefined
      ? [{ id: externalSortKey, desc: externalSortDir === 'desc' }]
      : []
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [internalPagination, setInternalPagination] = useState({ pageIndex: 0, pageSize: externalPageSize })
  const [internalDense, setInternalDense] = useState(dense)
  const [columnHidden, setColumnHidden] = useState<Record<string, boolean>>({})

  const sorting: SortingState = isControlled
    ? externalSortKey ? [{ id: externalSortKey, desc: externalSortDir === 'desc' }] : []
    : internalSorting

  const sortingRef = useRef(sorting)
  sortingRef.current = sorting
  const externalOnSortRef = useRef(externalOnSort)
  externalOnSortRef.current = externalOnSort
  const externalSortKeyRef = useRef(externalSortKey)
  externalSortKeyRef.current = externalSortKey

  const onSortingChange: OnChangeFn<SortingState> = useCallback((updaterOrValue) => {
    const hasExt = externalOnSortRef.current !== undefined
    const isCtrl = externalSortKeyRef.current !== undefined && externalOnSortRef.current !== undefined
    if (hasExt && externalOnSortRef.current) {
      const newState = typeof updaterOrValue === 'function'
        ? updaterOrValue(sortingRef.current)
        : updaterOrValue
      if (newState.length > 0) {
        externalOnSortRef.current(newState[0].id)
      }
    }
    if (!isCtrl) {
      setInternalSorting(updaterOrValue)
    }
  }, [])

  const hasExternalPagination = externalOnPageChange !== undefined
  const pageCount = hasExternalPagination
    ? (externalTotalPages ?? Math.ceil(data.length / externalPageSize))
    : undefined

  const coreRowModel = useMemo(() => getCoreRowModel(), [])
  const sortedRowModel = useMemo(() => getSortedRowModel(), [])
  const filteredRowModel = useMemo(() => getFilteredRowModel(), [])
  const paginationRowModel = useMemo(() => getPaginationRowModel(), [])
  const rowKeyRef = useRef(rowKey)
  rowKeyRef.current = rowKey
  const getRowId = useCallback((row: T) => rowKeyRef.current(row), [])

  const table = useReactTable({
    data,
    columns: tanColumns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination: hasExternalPagination
        ? { pageIndex: (externalPage ?? 1) - 1, pageSize: externalPageSize }
        : internalPagination,
    },
    onSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: hasExternalPagination ? undefined : setInternalPagination,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getFilteredRowModel: filteredRowModel,
    getPaginationRowModel: hasExternalPagination ? undefined : paginationRowModel,
    getRowId,
    enableRowSelection: !!onSelectionChange,
    enableSortingRemoval: false,
    manualPagination: hasExternalPagination,
    pageCount,
  })

  useEffect(() => {
    if (onSelectionChange) {
      const keys = table.getSelectedRowModel().rows.map(r => r.id)
      onSelectionChange(keys)
    }
  }, [rowSelection, onSelectionChange, table])

  useEffect(() => {
    setInternalDense(dense)
  }, [dense])

  const onRowClickRef = useRef(onRowClick)
  onRowClickRef.current = onRowClick
  const onSelectionChangeRef = useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange

  const handleRowClick = useCallback((e: React.MouseEvent, row: Row<T>) => {
    if ((e.ctrlKey || e.metaKey) && onSelectionChangeRef.current) {
      row.toggleSelected()
    } else if (onRowClickRef.current) {
      onRowClickRef.current(row.original)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: Row<T>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (onRowClickRef.current) onRowClickRef.current(row.original)
    }
  }, [])

  const tableRef = useRef(table)
  tableRef.current = table

  const handleExport = useCallback(() => {
    const rows = tableRef.current.getFilteredRowModel().rows
    const headers = columns.map(c => c.label)
    const csvRows = [headers.map(h => `"${h}"`).join(',')]
    for (const row of rows) {
      const vals = columns.map(c => {
        const val = (row.original as Record<string, unknown>)[c.key]
        const str = String(val ?? '')
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      })
      csvRows.push(vals.join(','))
    }
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [columns])

  function getFilterComponent(colDef: Column<T>) {
    const tanCol = table.getColumn(colDef.key)
    if (!tanCol || !colDef.filterType) return null
    const value = (tanCol.getFilterValue() ?? '') as string

    if (colDef.filterType === 'select' && colDef.filterOptions) {
      return (
        <select
          value={value}
          onChange={(e) => tanCol.setFilterValue(e.target.value || undefined)}
          className="h-7 w-full rounded border border-border/50 bg-transparent px-1 text-[11px] text-muted-foreground outline-none focus:border-ring cursor-pointer"
        >
          <option value="">All</option>
          {colDef.filterOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    }
    if (colDef.filterType === 'date') {
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

  const toolbarColumns = useMemo(() => columns.map(c => ({
    key: c.key, label: c.label, visible: !columnHidden[c.key],
  })), [columns, columnHidden])

  if (loading) {
    return (
      <div className="space-y-2 p-4 motion-fade-in">
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
    <div className="motion-fade-in">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        {toolbar && (
          <DataTableToolbar
            selectedCount={table.getSelectedRowModel().rows.length}
            onClearSelection={() => table.resetRowSelection()}
            onExport={handleExport}
            dense={internalDense}
            onDenseToggle={() => setInternalDense(d => !d)}
            columns={toolbarColumns}
            onColumnVisibilityChange={(key, visible) =>
              setColumnHidden(h => ({ ...h, [key]: !visible }))
            }
          />
        )}
        <div className="table-scroll overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-20 border-b border-border/70 bg-card">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => {
                  const meta = h.column.columnDef.meta
                  const colDef = columns.find(c => c.key === h.id)
                  if (!colDef || columnHidden[h.id]) return null
                  const canSort = h.column.getCanSort()
                  const sorted = h.column.getIsSorted()

                  return (
                    <th
                      key={h.id}
                      className={cn(
                        'relative px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                        canSort && 'cursor-pointer select-none',
                        meta?.pinned === 'left' && 'sticky left-0 z-10 bg-card shadow-[2px_0_4px_-2px] shadow-border/30',
                        meta?.pinned === 'right' && 'sticky right-0 z-10 bg-card shadow-[-2px_0_4px_-2px] shadow-border/30',
                        colDef.hideBelow && `hidden ${colDef.hideBelow}:table-cell`,
                        colDef.className,
                      )}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                      style={{
                        width: colDef.resizable ? h.getSize() : undefined,
                        minWidth: colDef.resizable ? 80 : undefined,
                      }}
                      aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted && (
                          sorted === 'asc'
                            ? <ChevronUp className="size-3 shrink-0 transition-transform" />
                            : <ChevronDown className="size-3 shrink-0 transition-transform" />
                        )}
                      </div>
                      {colDef.resizable && (
                        <div
                          onMouseDown={h.getResizeHandler()}
                          onTouchStart={h.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-border/80 transition-colors"
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
                  if (!colDef || columnHidden[col.id]) return null
                  return (
                    <th
                      key={col.id}
                      className={cn(
                        'px-3 py-1.5',
                        colDef.hideBelow && `hidden ${colDef.hideBelow}:table-cell`,
                      )}
                    >
                      {colDef.filterType && getFilterComponent(colDef)}
                    </th>
                  )
                })}
              </tr>
            )}
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-muted-foreground">
                    No results match your filters.
                  </td>
                </tr>
              ) : (
                displayRows.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={(e) => handleRowClick(e, row)}
                    onKeyDown={(e) => handleKeyDown(e, row)}
                    tabIndex={onRowClick || onSelectionChange ? 0 : undefined}
                    role={onRowClick || onSelectionChange ? 'button' : undefined}
                    className={cn(
                      'border-b border-border/60 even:bg-muted/30 transition-colors duration-150',
                      'hover:bg-accent/40',
                      row.getIsSelected() && 'bg-gold/10 ring-1 ring-inset ring-gold/30',
                      (onRowClick || onSelectionChange) && 'cursor-pointer',
                    )}
                  >
                    {row.getVisibleCells().map(cell => {
                      const cellColDef = columns.find(c => c.key === cell.column.id)
                      if (!cellColDef || columnHidden[cell.column.id]) return null
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-3',
                            internalDense ? 'py-1.5 text-xs' : 'py-3 text-sm',
                            cellColDef.hideBelow && `hidden ${cellColDef.hideBelow}:table-cell`,
                            cellColDef.className,
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        page={hasExternalPagination ? (externalPage ?? 1) : table.getState().pagination.pageIndex + 1}
        totalPages={hasExternalPagination ? pageCount! : table.getPageCount()}
        totalItems={hasExternalPagination ? (externalTotalItems ?? data.length) : table.getFilteredRowModel().rows.length}
        onPageChange={(p) => {
          if (hasExternalPagination) {
            externalOnPageChange!(p)
          } else {
            table.setPageIndex(p - 1)
          }
        }}
        pageSize={externalPageSize}
      />
    </div>
  )
}

export const DataTable = memo(DataTableInner) as unknown as typeof DataTableInner
