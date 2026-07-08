import { useState, useEffect } from 'react'
import { User, Clock, Database } from 'lucide-react'
import { getActivities, type ApiActivity } from '@/api/activity'
import { DataTable, type Column } from '@/components/ui/data-table'
import { cn, formatDateTime } from '@/lib/utils'

const actionColors: Record<string, string> = {
  create: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  update: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  delete: 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30',
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ApiActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActivities(1, 500)
      .then((data) => setLogs(data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<ApiActivity>[] = [
    { key: 'action', label: 'Action', filterType: 'select',
      filterOptions: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
      ],
      render: (a) => (
        <span className={cn('inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold', actionColors[a.action])}>
          {a.action}
        </span>
      ) },
    { key: 'collection', label: 'Collection', sortable: true, filterType: 'text',
      render: (a) => <span className="text-xs capitalize">{a.collection.replace(/_/g, ' ')}</span> },
    { key: 'user_name', label: 'User', sortable: true, filterType: 'text',
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="size-3" />
          </div>
          <span className="font-medium text-xs">{a.user_name}</span>
        </div>
      ) },
    { key: 'details', label: 'Details', filterType: 'text',
      render: (a) => <span className="text-xs text-muted-foreground">{a.details || '—'}</span> },
    { key: 'created', label: 'Date', sortable: true, filterType: 'date',
      render: (a) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(a.created)}</span> },
  ]

  return (
    <>
      <div className="-ml-4 -mr-4 sm:-ml-6 sm:-mr-6 lg:-ml-8 lg:-mr-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-56px)] h-[calc(100dvh-60px)] md:h-[calc(100dvh-52px)] flex flex-col overflow-hidden">
        <DataTable
          title="ACTIVITY LOGS"
          columns={columns}
          data={logs}
          loading={loading}
          emptyState={<p className="text-center text-muted-foreground py-12">No activity recorded yet.</p>}
          rowKey={(a) => a.id}
          toolbar
          exportable
          sortKey="created"
          sortDir="desc"
        />
      </div>
    </>
  )
}
