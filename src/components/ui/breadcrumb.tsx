import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  href?: string
  label: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link to={item.href} className="hover:text-foreground transition-colors">{item.label}</Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-foreground font-medium' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
