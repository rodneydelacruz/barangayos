import { Users, FileText, Scale, DoorOpen, Package, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardStats } from './hooks/useDashboardData'
import type { Role } from '@/auth/session'

interface KpiCard {
  label: string
  metricKey: string
  value: number | string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  roles: Role[]
}

interface DashboardKPIProps {
  stats: DashboardStats
  role: Role
  loading: boolean
  config?: Record<string, unknown>
}

export default function DashboardKPI({ stats, role, loading, config }: DashboardKPIProps) {
  const selectedMetrics = (config?.metrics as string[]) ?? null

  const allCards: KpiCard[] = [
    { label: 'Residents', metricKey: 'residents', value: stats.residents, sub: `${stats.voters} voters`, icon: Users, color: 'text-barangay', roles: ['admin', 'staff', 'viewer'] },
    { label: 'Document Requests', metricKey: 'pendingDocuments', value: stats.pendingDocuments, sub: 'pending', icon: FileText, color: 'text-gold', roles: ['admin', 'staff', 'viewer'] },
    { label: 'Blotter Cases', metricKey: 'blotterActive', value: stats.blotterActive, sub: 'active', icon: Scale, color: 'text-red-pinoy', roles: ['admin', 'staff', 'viewer'] },
    { label: 'Visitors', metricKey: 'visitorsToday', value: stats.visitorsToday, sub: `${stats.visitorsActive} now`, icon: DoorOpen, color: 'text-accent-teal', roles: ['admin', 'staff'] },
    { label: 'Meetings Today', metricKey: 'meetingsToday', value: stats.meetingsToday, sub: 'today', icon: Calendar, color: 'text-narra', roles: ['admin', 'staff'] },
    { label: 'Assets', metricKey: 'assets', value: `₱${(stats.assetsValue / 1000).toFixed(1)}K`, sub: `${stats.assetsTotal} items`, icon: Package, color: 'text-narra', roles: ['admin'] },
    { label: 'Settled Cases', metricKey: 'settledCases', value: stats.settledCases, sub: 'total', icon: CheckCircle2, color: 'text-accent-teal', roles: ['admin', 'staff'] },
    { label: 'Pending Documents', metricKey: 'pendingDocuments', value: stats.pendingDocuments, sub: 'for release', icon: Clock, color: 'text-gold', roles: ['admin'] },
  ]

  const roleCards = allCards.filter((card) => card.roles.includes(role))
  const visibleCards = selectedMetrics
    ? roleCards.filter((card) => selectedMetrics.includes(card.metricKey))
    : roleCards

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 motion-stagger-75">
      {visibleCards.map((card, i) => {
        const Icon = card.icon
        const isPrimary = i === 0
        return (
          <Card
            key={card.label}
            variant={isPrimary ? 'elevated' : 'default'}
            className="overflow-hidden motion-lift"
            style={{ '--stagger-index': i } as React.CSSProperties}
          >
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <div className={cn('h-7 w-16 animate-pulse rounded', isPrimary ? 'bg-primary-foreground/20' : 'bg-muted')} />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn(
                      'text-xs font-medium uppercase tracking-wider',
                      isPrimary ? 'text-primary-foreground/60' : 'text-muted-foreground/70',
                    )}>{card.label}</p>
                    <p className={cn(
                      'mt-1 font-bold',
                      isPrimary ? 'text-3xl text-primary-foreground' : 'text-2xl text-foreground',
                    )}>{card.value}</p>
                    <p className={cn(
                      'mt-0.5 text-[11px]',
                      isPrimary ? 'text-primary-foreground/50' : 'text-muted-foreground/60',
                    )}>{card.sub}</p>
                  </div>
                  <Icon className={cn(
                    'size-5 shrink-0 mt-0.5',
                    isPrimary ? 'text-primary-foreground/40' : card.color,
                  )} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
