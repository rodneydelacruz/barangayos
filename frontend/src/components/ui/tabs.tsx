import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
  className?: string
  children?: ReactNode
}

export function Tabs({ tabs, activeId, onChange, className, children }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 rounded-md border bg-card p-1', className)} role="tablist">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors',
              tab.id === activeId
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            {tab.icon && <span className="size-3.5">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      {children && (
        <div className="ml-auto pl-2 border-l border-border">
          {children}
        </div>
      )}
    </div>
  )
}
