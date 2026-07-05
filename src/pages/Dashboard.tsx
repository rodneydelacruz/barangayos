import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { FileText, Clock, CheckCircle2, XCircle, Scale, ArrowUpCircle } from 'lucide-react'
import { getBlotters, getBlottersSummary, type ApiBlotter } from '@/api/blotter'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  pending:   { label: 'Pending',   icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
  hearing:   { label: 'Hearing',   icon: Scale,        color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
  settled:   { label: 'Settled',   icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  escalated: { label: 'Escalated', icon: ArrowUpCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  dismissed: { label: 'Dismissed', icon: XCircle,      color: 'text-red-pinoy',   bg: 'bg-red-50 dark:bg-red-500/10' },
}

interface Stat {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<{ total: number; pending: number; hearing: number; settled: number; escalated: number; dismissed: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentRecords, setRecentRecords] = useState<ApiBlotter[]>([])

  useEffect(() => {
    getBlottersSummary().then(setStats).catch((err) => {
      console.error(err)
      setStats({ total: 0, pending: 0, hearing: 0, settled: 0, escalated: 0, dismissed: 0 })
    }).finally(() => setLoading(false))

    getBlotters().then((all) => setRecentRecords(all.slice(0, 5))).catch(() => setRecentRecords([]))
  }, [])

  const statCards: Stat[] = [
    { label: 'Total Records', value: stats?.total ?? 0, icon: FileText, color: 'text-barangay' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Hearing', value: stats?.hearing ?? 0, icon: Scale, color: 'text-blue-500' },
    { label: 'Settled', value: stats?.settled ?? 0, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Escalated', value: stats?.escalated ?? 0, icon: ArrowUpCircle, color: 'text-orange-500' },
    { label: 'Dismissed', value: stats?.dismissed ?? 0, icon: XCircle, color: 'text-red-pinoy' },
  ]

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of barangay records and system activity" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 motion-stagger-75">
          {statCards.map((stat, i) => (
            <Card key={stat.label} className="overflow-hidden motion-lift" style={{ ['--stagger-index' as string]: i }}>
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
                      <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <stat.icon className={cn('size-5 shrink-0 mt-0.5', stat.color)} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="motion-fade-in motion-slide-up">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link to="/records" className="block">
                  <Button variant="default" size="sm" className="w-full justify-start gap-2 motion-press">
                    <FileText className="size-4" />
                    New Blotter Case
                  </Button>
                </Link>
                <Link to="/records" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 motion-press">
                    View All Cases
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="motion-fade-in motion-slide-up" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
              {recentRecords.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground/60">
                  Select a module from the navigation to get started.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recentRecords.map((record) => {
                    const cfg = statusConfig[record.status]
                    const StatusIcon = cfg.icon
                    return (
                      <li key={record.id} className="flex items-start gap-3 text-sm">
                        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{record.case_number} — {record.complainant_name}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
                              <StatusIcon className="size-2.5" />
                              {cfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground">{new Date(record.updated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
