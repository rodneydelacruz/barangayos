import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { type ReactNode } from 'react'
import { X, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DetailPanelProps {
  open: boolean
  onClose: () => void
  title: string
  onEdit?: () => void
  onDelete?: () => void
  loading?: boolean
  children?: ReactNode
}

export function DetailPanel({ open, onClose, title, onEdit, onDelete, loading, children }: DetailPanelProps) {
  useBodyScrollLock(open)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
      <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={onClose} />
      <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:w-1/2 md:border-l md:border-border max-md:max-h-[85vh] font-display">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
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
          <div className="space-y-6 p-5 text-sm">{children}</div>
        )}
      </div>
    </div>
  )
}

export function DetailSection({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className={cn(
        'mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider',
        'text-muted-foreground',
      )}>
        {icon}
        {title}
      </h3>
      <div className="border border-border/50 bg-muted/30 p-3">{children}</div>
    </div>
  )
}
