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
    { label: 'Document Requests', metricKey: 'pendingDocuments', value: stats.pendingDocuments, sub: 'pending', icon: FileText, color: 'text-amber-500', roles: ['admin', 'staff', 'viewer'] },
    { label: 'Blotter Cases', metricKey: 'blotterActive', value: stats.blotterActive, sub: 'active', icon: Scale, color: 'text-blue-500', roles: ['admin', 'staff', 'viewer'] },
    { label: 'Visitors', metricKey: 'visitorsToday', value: stats.visitorsToday, sub: `${stats.visitorsActive} now`, icon: DoorOpen, color: 'text-emerald-500', roles: ['admin', 'staff'] },
    { label: 'Meetings Today', metricKey: 'meetingsToday', value: stats.meetingsToday, sub: 'today', icon: Calendar, color: 'text-purple-500', roles: ['admin', 'staff'] },
    { label: 'Assets', metricKey: 'assets', value: `₱${(stats.assetsValue / 1000).toFixed(1)}K`, sub: `${stats.assetsTotal} items`, icon: Package, color: 'text-narra', roles: ['admin'] },
    { label: 'Settled Cases', metricKey: 'settledCases', value: stats.settledCases, sub: 'total', icon: CheckCircle2, color: 'text-emerald-500', roles: ['admin', 'staff'] },
    { label: 'Pending Documents', metricKey: 'pendingDocuments', value: stats.pendingDocuments, sub: 'for release', icon: Clock, color: 'text-orange-500', roles: ['admin'] },
  ]

  const roleCards = allCards.filter((card) => card.roles.includes(role))
  const visibleCards = selectedMetrics
    ? roleCards.filter((card) => selectedMetrics.includes(card.metricKey))
    : roleCards

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 motion-stagger-75">
      {visibleCards.map((card, i) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="overflow-hidden motion-lift" style={{ '--stagger-index': i } as React.CSSProperties}>
            <div className="h-1 w-full bg-gold/60" />
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">{card.sub}</p>
                  </div>
                  <Icon className={cn('size-5 shrink-0 mt-0.5', card.color)} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
