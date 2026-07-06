import { cn } from '@/lib/utils'
import { Inbox, SearchX, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  variant?: 'default' | 'search' | 'error'
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

const icons = {
  default: Inbox,
  search: SearchX,
  error: AlertCircle,
}

export function EmptyState({ variant = 'default', title, description, action, className }: EmptyStateProps) {
  const Icon = icons[variant]
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center motion-fade-in motion-scale-in', className)}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className={cn('size-6', variant === 'error' ? 'text-destructive' : 'text-muted-foreground')} />
      </div>
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
