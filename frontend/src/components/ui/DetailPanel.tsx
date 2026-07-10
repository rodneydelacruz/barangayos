import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { type ReactNode } from 'react'
import { X, Pencil, Trash2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DetailPanelProps {
  open: boolean
  onClose: () => void
  title: string
  onEdit?: () => void
  onDelete?: () => void
  onExport?: () => void
  loading?: boolean
  children?: ReactNode
}

export function DetailPanel({ open, onClose, title, onEdit, onDelete, onExport, loading, children }: DetailPanelProps) {
  useBodyScrollLock(open)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
      <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={onClose} />
      <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:w-1/2 md:border-l md:border-border max-md:max-h-[85vh] font-display">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-5 py-3">
          <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded"
              >
                <Download className="size-3" />
                Export
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded"
              >
                <Trash2 className="size-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded"
              aria-label="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-5 p-5 text-sm">{children}</div>
        )}
      </div>
    </div>
  )
}

export function DetailSection({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className={cn(
        'mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider',
        'text-muted-foreground',
      )}>
        {icon}
        {title}
      </h3>
      <div className="border border-border/50 bg-muted/30 p-2.5 rounded-sm">{children}</div>
    </div>
  )
}

export function FieldRow({ label, value, children, className }: { label: string; value?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn(
      'grid grid-cols-[160px_1fr] border-b border-border/50 last:border-b-0',
      className,
    )}>
      <span className="px-2.5 py-1.5 text-xs leading-relaxed text-muted-foreground border-r border-border/50 break-words hyphens-auto">
        {label}
      </span>
      <div className="px-2.5 py-1.5 text-xs leading-relaxed font-medium text-foreground break-words hyphens-auto [&>*]:leading-relaxed">
        {children ?? (value ?? '—')}
      </div>
    </div>
  )
}
