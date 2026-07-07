import { useState, useRef, useEffect } from 'react'
import { Download, Columns2, Minimize2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface ToolbarColumn {
  key: string
  label: string
  visible: boolean
}

export interface DataTableToolbarProps {
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
  const [columnOpen, setColumnOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setColumnOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={cn('flex items-center justify-between gap-2 px-2 py-1.5 border-b border-border/60', className)}>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold motion-fade-in">
            <span>{selectedCount} selected</span>
            <button type="button" onClick={onClearSelection} className="hover:text-foreground transition-colors" aria-label="Clear selection">
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onDenseToggle} title="Toggle dense mode" className="h-9 w-9 rounded-md">
          <Minimize2 className={cn('size-4 transition-transform', dense && 'rotate-180')} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onExport} title="Export to CSV" className="h-9 w-9 rounded-md">
          <Download className="size-4" />
        </Button>
        <div ref={ref} className="relative">
          <Button variant="ghost" size="icon" onClick={() => setColumnOpen((o) => !o)} title="Toggle columns" className="h-9 w-9 rounded-md">
            <Columns2 className="size-4" />
          </Button>
          {columnOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-lg border bg-card p-1.5 shadow-lg motion-scale-in">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={(e) => onColumnVisibilityChange(col.key, e.target.checked)}
                    className="size-3.5 accent-gold rounded"
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
