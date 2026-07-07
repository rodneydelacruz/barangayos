import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm motion-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-sm motion-scale-in border bg-card shadow-lg',
          destructive ? 'border-red-pinoy/20' : 'border-gold/20',
        )}
      >
        <div
          className={cn(
            'h-1',
            destructive ? 'bg-red-pinoy' : 'bg-gold',
          )}
        />
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center',
                destructive
                  ? 'bg-red-pinoy/10 text-red-pinoy'
                  : 'bg-gold/10 text-gold',
              )}
            >
              <AlertTriangle className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {message}
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={loading}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              ref={confirmRef}
              type="button"
              variant={destructive ? 'destructive' : 'default'}
              size="sm"
              onClick={onConfirm}
              disabled={loading}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              {loading && (
                <span className="size-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
              )}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
