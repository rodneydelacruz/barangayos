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
      pending: '#f59e0b', processing: '#3b82f6', for_release: '#10b981',
      released: '#6b7280', cancelled: '#ef4444',
    }
    return { label: key.replace(/_/g, ' '), count, color: colorMap[key] ?? '#6b7280' }
  })

  return (
    <div className="font-display">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Dashboard</h1>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
          Customize
        </button>
      </div>

      <div className="space-y-5">
        {isVisible('hero') && <DashboardHero userName={userName} role={role} stats={stats} />}
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
