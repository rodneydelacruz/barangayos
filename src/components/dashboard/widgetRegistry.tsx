export interface WidgetDefinition {
  id: string
  label: string
  description: string
  roles: string[]
  configFields?: ConfigField[]
}

export interface ConfigField {
  key: string
  label: string
  type: 'checkbox-list' | 'segmented' | 'number'
  options?: { label: string; value: string }[]
  items?: { label: string; value: string }[]
  min?: number
  max?: number
}

export const DASHBOARD_WIDGETS: WidgetDefinition[] = [
  {
    id: 'kpi-strip',
    label: 'KPI Metrics',
    description: 'Key performance indicator cards',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'metrics', label: 'Show Metrics', type: 'checkbox-list', items: [
        { label: 'Residents', value: 'residents' },
        { label: 'Document Requests', value: 'pendingDocuments' },
        { label: 'Blotter Cases', value: 'blotterActive' },
        { label: 'Visitors', value: 'visitorsToday' },
        { label: 'Meetings Today', value: 'meetingsToday' },
        { label: 'Assets', value: 'assets' },
        { label: 'Settled Cases', value: 'settledCases' },
      ] },
    ],
  },
  {
    id: 'quick-actions',
    label: 'Quick Actions',
    description: 'Frequently used action buttons',
    roles: ['admin', 'staff', 'viewer'],
  },
  {
    id: 'tasks',
    label: 'Priority Tasks',
    description: 'Role-based pending tasks',
    roles: ['admin', 'staff', 'viewer'],
  },
  {
    id: 'activity-feed',
    label: 'Activity Feed',
    description: 'Recent system activity',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'pageSize', label: 'Items to show', type: 'number', min: 3, max: 20 },
    ],
  },
  {
    id: 'document-chart',
    label: 'Document Status Chart',
    description: 'Document distribution visualization',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'segmented', options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Donut', value: 'donut' },
      ] },
    ],
  },
  {
    id: 'system-status',
    label: 'System Status',
    description: 'Database, network, and version info',
    roles: ['admin', 'staff'],
  },
  {
    id: 'budget-snapshot',
    label: 'Budget Snapshot',
    description: 'Quick budget overview card',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'metric', label: 'Highlight Metric', type: 'segmented', options: [
        { label: 'Income', value: 'income' },
        { label: 'Balance', value: 'balance' },
        { label: 'Disbursed', value: 'disbursed' },
      ] },
    ],
  },
]

export const BUDGET_WIDGETS: WidgetDefinition[] = [
  {
    id: 'compliance-warnings',
    label: 'Compliance Warnings',
    description: 'Statutory shortfall and PS cap warnings',
    roles: ['admin', 'staff'],
  },
  {
    id: 'stat-cards',
    label: 'Stat Cards',
    description: 'Summary financial metrics',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'metrics', label: 'Show Metrics', type: 'checkbox-list', items: [
        { label: 'Total Income', value: 'income' },
        { label: 'Appropriated', value: 'appropriated' },
        { label: 'Disbursed', value: 'disbursed' },
        { label: 'Balance', value: 'balance' },
        { label: 'Utilization', value: 'utilization' },
      ] },
    ],
  },
  {
    id: 'expense-cards',
    label: 'Expense Class Cards',
    description: 'PS, MOOE, CO breakdown',
    roles: ['admin', 'staff', 'viewer'],
    configFields: [
      { key: 'detailMode', label: 'Display Mode', type: 'segmented', options: [
        { label: 'Detailed', value: 'detailed' },
        { label: 'Compact', value: 'compact' },
      ] },
    ],
  },
  {
    id: 'disbursements-chart',
    label: 'Disbursements Chart',
    description: '30-day disbursement trend',
    roles: ['admin', 'staff'],
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'segmented', options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Line', value: 'line' },
        { label: 'Area', value: 'area' },
      ] },
    ],
  },
  {
    id: 'revenue-chart',
    label: 'Revenue Chart',
    description: '30-day revenue trend',
    roles: ['admin', 'staff'],
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'segmented', options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Line', value: 'line' },
        { label: 'Area', value: 'area' },
      ] },
    ],
  },
  {
    id: 'utilization-chart',
    label: 'Utilization Rate Chart',
    description: 'Budget utilization rate trend',
    roles: ['admin', 'staff'],
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'segmented', options: [
        { label: 'Line', value: 'line' },
        { label: 'Area', value: 'area' },
      ] },
    ],
  },
]
