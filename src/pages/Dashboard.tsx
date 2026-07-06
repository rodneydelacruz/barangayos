import DashboardHero from './DashboardHero'
import DashboardSearch from './DashboardSearch'
import DashboardKPI from './DashboardKPI'
import DashboardQuickActions from './DashboardQuickActions'
import DashboardTasks from './DashboardTasks'
import DashboardActivity from './DashboardActivity'
import DashboardChart from './DashboardChart'
import DashboardSystemStatus from './DashboardSystemStatus'
import { useDashboardData } from './hooks/useDashboardData'
import { PageHeader } from '@/components/ui/PageHeader'

export default function Dashboard() {
  const { user, stats, tasks, recentActivity, loading } = useDashboardData()
  const role = user?.role ?? 'viewer'
  const userName = user?.name ?? 'User'

  const documentItems = Object.entries(stats.documentByStatus).map(([key, count]) => {
    const colorMap: Record<string, string> = {
      pending: '#f59e0b', processing: '#3b82f6', for_release: '#10b981',
      released: '#6b7280', cancelled: '#ef4444',
    }
    return { label: key.replace(/_/g, ' '), count, color: colorMap[key] ?? '#6b7280' }
  })

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of barangay records and system activity" />
      <div className="space-y-5">
        <DashboardHero userName={userName} role={role} stats={stats} />
        <DashboardSearch />
        <DashboardKPI stats={stats} role={role} loading={loading} />
        <DashboardQuickActions role={role} />
        <div className="grid gap-5 lg:grid-cols-2">
          <DashboardTasks tasks={tasks} />
          <DashboardActivity activities={recentActivity} role={role} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <DashboardChart title="Document Status Distribution" items={documentItems} total={stats.documentTotal} />
          <DashboardSystemStatus />
        </div>
      </div>
    </>
  )
}
