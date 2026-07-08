import { useState } from 'react'
import DashboardHero from './DashboardHero'
import DashboardSearch from './DashboardSearch'
import DashboardKPI from './DashboardKPI'
import DashboardQuickActions from './DashboardQuickActions'
import DashboardTasks from './DashboardTasks'
import DashboardActivity from './DashboardActivity'
import DashboardChart from './DashboardChart'
import DashboardSystemStatus from './DashboardSystemStatus'
import DashboardBudgetSnapshot from './DashboardBudgetSnapshot'
import { useDashboardData } from './hooks/useDashboardData'
import { useWidgetConfig } from '@/components/dashboard/useWidgetConfig'
import { DASHBOARD_WIDGETS } from '@/components/dashboard/widgetRegistry'
import { WidgetSheet } from '@/components/dashboard/WidgetSheet'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user, stats, tasks, recentActivity, loading } = useDashboardData()
  const role = user?.role ?? 'viewer'
  const userName = user?.name ?? 'User'
  const { config, updateWidget, resetToDefaults, isVisible, getWidgetConfig } = useWidgetConfig('dashboard', role)
  const [sheetOpen, setSheetOpen] = useState(false)

  const documentItems = Object.entries(stats.documentByStatus).map(([key, count]) => {
    const colorMap: Record<string, string> = {
      pending: '#D4A854', processing: '#1E2A4A', for_release: '#2D8B7A',
      released: '#A09688', cancelled: '#CE1126',
    }
    return { label: key.replace(/_/g, ' '), count, color: colorMap[key] ?? '#A09688' }
  })

  return (
    <div>

      <div className="space-y-4">
        {isVisible('hero') && <DashboardHero onCustomize={() => setSheetOpen(true)} />}
        {isVisible('search') && <DashboardSearch />}
        {isVisible('kpi-strip') && (
          <DashboardKPI stats={stats} role={role} loading={loading} config={getWidgetConfig('kpi-strip')} />
        )}
        {isVisible('quick-actions') && <DashboardQuickActions role={role} />}
        <div className={cn('grid gap-5 lg:grid-cols-2', (!isVisible('tasks') || !isVisible('activity-feed')) && '')}>
          {isVisible('tasks') && <DashboardTasks tasks={tasks} />}
          {isVisible('activity-feed') && <DashboardActivity activities={recentActivity} config={getWidgetConfig('activity-feed')} />}
        </div>
        <div className={cn('grid gap-5 lg:grid-cols-2', (!isVisible('document-chart') || !isVisible('budget-snapshot')) && '')}>
          {isVisible('document-chart') && <DashboardChart title="Document Status Distribution" items={documentItems} total={stats.documentTotal} config={getWidgetConfig('document-chart')} />}
          {isVisible('budget-snapshot') && <DashboardBudgetSnapshot metric={(getWidgetConfig('budget-snapshot') as { metric?: string })?.metric} />}
        </div>
        {isVisible('system-status') && <DashboardSystemStatus />}
      </div>

      <WidgetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        widgets={DASHBOARD_WIDGETS}
        config={config}
        onUpdateWidget={updateWidget}
        onReset={resetToDefaults}
      />
    </div>
  )
}
