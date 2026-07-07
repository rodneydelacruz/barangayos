import { type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="mb-5 motion-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-1 h-6 shrink-0 bg-gold" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="font-display text-lg font-semibold text-foreground truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="shrink-0">{children}</div>
        )}
      </div>
      <div className="mt-3 border-b border-bamboo/40" />
    </div>
  )
}
