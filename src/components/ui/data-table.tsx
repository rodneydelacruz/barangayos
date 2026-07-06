import { type ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Pagination from '@/components/ui/Pagination'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  hideBelow?: 'sm' | 'md' | 'lg'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (item: T) => void
  emptyState?: ReactNode
  page?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  rowKey: (item: T) => string
}

export function DataTable<T>({
  columns, data, loading, sortKey, sortDir, onSort, onRowClick,
  emptyState, page, totalPages, totalItems, onPageChange, pageSize = 25, rowKey,
}: DataTableProps<T>) {
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

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'py-3 px-3 font-medium text-muted-foreground',
                      col.sortable && 'cursor-pointer hover:text-foreground select-none',
                      col.hideBelow && `hidden ${col.hideBelow}:table-cell`,
                      col.className,
                    )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  aria-sort={col.sortable && sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={rowKey(item)}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onRowClick) { e.preventDefault(); onRowClick(item) } }}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                className={cn(
                  'border-b last:border-0 transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-muted/50' : '',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('py-3 px-3', col.hideBelow && `hidden ${col.hideBelow}:table-cell`, col.className)}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={rowKey(item)}
            onClick={() => onRowClick?.(item)}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onRowClick) { e.preventDefault(); onRowClick(item) } }}
            tabIndex={onRowClick ? 0 : undefined}
            role={onRowClick ? 'button' : undefined}
            className={cn(
              'rounded-lg border bg-card p-4 space-y-2',
              onRowClick ? 'cursor-pointer hover:bg-muted/30' : '',
            )}
          >
            {columns.map((col) => {
              if (col.hideBelow) return null
              const value = col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')
              if (value === null || value === undefined) return null
              return (
                <div key={col.key} className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground shrink-0">{col.label}</span>
                  <span className="text-right">{value}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {page !== undefined && totalPages !== undefined && totalItems !== undefined && onPageChange && (
        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={onPageChange} pageSize={pageSize} />
      )}
    </div>
  )
}
