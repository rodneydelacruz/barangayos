import { useCallback, useEffect, useState } from 'react'

export interface WidgetState {
  visible: boolean
  config?: Record<string, unknown>
}

export interface DashboardConfig {
  version: number
  widgets: Record<string, WidgetState>
}

export type Page = 'dashboard' | 'budget'

const STORAGE_KEYS: Record<Page, string> = {
  dashboard: 'brgy-dashboard-config',
  budget: 'brgy-budget-config',
}

const ROLE_DEFAULTS: Record<Page, Record<string, Record<string, WidgetState>>> = {
  dashboard: {
    admin: {
      hero: { visible: true },
      search: { visible: true },
      'kpi-strip': { visible: true, config: { metrics: ['residents', 'pendingDocuments', 'blotterActive', 'visitorsToday', 'meetingsToday', 'assets', 'settledCases'] } },
      'quick-actions': { visible: true },
      tasks: { visible: true },
      'activity-feed': { visible: true, config: { pageSize: 5 } },
      'document-chart': { visible: true, config: { chartType: 'bar' } },
      'system-status': { visible: true },
      'budget-snapshot': { visible: true, config: { metric: 'balance' } },
    },
    staff: {
      hero: { visible: true },
      search: { visible: true },
      'kpi-strip': { visible: true, config: { metrics: ['residents', 'pendingDocuments', 'blotterActive', 'visitorsToday', 'meetingsToday', 'settledCases'] } },
      'quick-actions': { visible: true },
      tasks: { visible: true },
      'activity-feed': { visible: true, config: { pageSize: 5 } },
      'document-chart': { visible: true, config: { chartType: 'bar' } },
      'system-status': { visible: true },
      'budget-snapshot': { visible: true, config: { metric: 'balance' } },
    },
    viewer: {
      hero: { visible: true },
      search: { visible: true },
      'kpi-strip': { visible: true, config: { metrics: ['residents', 'pendingDocuments', 'blotterActive'] } },
      tasks: { visible: true },
      'document-chart': { visible: true, config: { chartType: 'bar' } },
    },
  },
  budget: {
    admin: {
      'stat-cards': { visible: true, config: { metrics: ['income', 'appropriated', 'disbursed', 'balance', 'utilization'] } },
      'compliance-warnings': { visible: true },
      'expense-cards': { visible: true, config: { detailMode: 'detailed' } },
      'disbursements-chart': { visible: true, config: { chartType: 'bar' } },
      'revenue-chart': { visible: true, config: { chartType: 'bar' } },
      'utilization-chart': { visible: true, config: { chartType: 'line' } },
    },
    staff: {
      'stat-cards': { visible: true, config: { metrics: ['income', 'appropriated', 'disbursed', 'balance'] } },
      'compliance-warnings': { visible: true },
      'expense-cards': { visible: true, config: { detailMode: 'detailed' } },
      'disbursements-chart': { visible: true, config: { chartType: 'bar' } },
      'revenue-chart': { visible: true, config: { chartType: 'bar' } },
      'utilization-chart': { visible: true, config: { chartType: 'line' } },
    },
    viewer: {
      'stat-cards': { visible: true, config: { metrics: ['income', 'appropriated', 'balance'] } },
      'expense-cards': { visible: true, config: { detailMode: 'compact' } },
    },
  },
}

function loadConfig(page: Page, role: string): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[page])
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardConfig
      if (parsed.version === 1) return parsed
    }
  } catch {}
  return getDefaultConfig(page, role)
}

function getDefaultConfig(page: Page, role: string): DashboardConfig {
  const roleKey = role in ROLE_DEFAULTS[page] ? role : 'viewer'
  return { version: 1, widgets: { ...ROLE_DEFAULTS[page][roleKey] } }
}

function saveConfig(page: Page, config: DashboardConfig) {
  localStorage.setItem(STORAGE_KEYS[page], JSON.stringify(config))
}

export function useWidgetConfig(page: Page, role: string) {
  const [config, setConfig] = useState<DashboardConfig>(() => loadConfig(page, role))

  useEffect(() => {
    setConfig(loadConfig(page, role))
  }, [page, role])

  useEffect(() => {
    saveConfig(page, config)
  }, [page, config])

  const updateWidget = useCallback((id: string, changes: Partial<WidgetState>) => {
    setConfig((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [id]: { ...prev.widgets[id], ...changes },
      },
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setConfig(getDefaultConfig(page, role))
  }, [page, role])

  const isVisible = useCallback(
    (id: string): boolean => config.widgets[id]?.visible ?? false,
    [config],
  )

  const getWidgetConfig = useCallback(
    (id: string): Record<string, unknown> | undefined => config.widgets[id]?.config,
    [config],
  )

  return { config, updateWidget, resetToDefaults, isVisible, getWidgetConfig } as const
}
