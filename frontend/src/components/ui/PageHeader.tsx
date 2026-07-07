import { type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="mb-6 motion-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 w-1 h-8 shrink-0 bg-gold" aria-hidden="true" />
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground/70">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="shrink-0">{children}</div>
        )}
      </div>
      <div className="mt-4 border-b border-bamboo/40" />
    </div>
  )
}
