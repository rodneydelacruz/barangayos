import { useState, useEffect } from 'react'
import { User, Clock, Database, FileText } from 'lucide-react'
import { getActivities, type ApiActivity } from '@/api/activity'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { cn, formatDateTime } from '@/lib/utils'
import { DataTable, type Column } from '@/components/ui/data-table'

const collectionOptions = [
  { value: '', label: 'All Collections' },
  { value: 'residents', label: 'Residents' },
  { value: 'households', label: 'Households' },
  { value: 'document_requests', label: 'Document Requests' },
  { value: 'blotter_records', label: 'Blotter Records' },
  { value: 'visitor_logs', label: 'Visitor Logs' },
]

const actionColors: Record<string, string> = {
  create: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  update: 'bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  delete: 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const columns: Column<ApiActivity>[] = [
  { key: 'action', label: 'Action',
    render: (a) => (
      <span className={cn('inline-flex rounded-md px-3.5 py-0.5 text-xs font-bold', actionColors[a.action] || 'bg-muted text-muted-foreground')}>
        {a.action}
      </span>
    ) },
  { key: 'collection', label: 'Collection', sortable: true,
    render: (a) => a.collection?.replace(/_/g, ' ') ?? '—' },
  { key: 'details', label: 'Details', render: (a) => a.details ?? '—' },
  { key: 'user_name', label: 'User', sortable: true },
  { key: 'created', label: 'Timestamp', sortable: true,
    render: (a) => a.created ? formatDateTime(a.created) : '' },
]

export default function ActivityPage() {
  const [activities, setActivities] = useState<ApiActivity[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<string>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [collectionFilter, setCollectionFilter] = useState('')
  const [flyoutActivity, setFlyoutActivity] = useState<ApiActivity | null>(null)

  function closeFlyout() {
    setFlyoutActivity(null)
  }

  async function fetchActivities(
    p: number,
    sort: string,
    collection: string,
    append = false,
  ) {
    setLoading(true)
    try {
      const result = await getActivities(p, 25, sort, collection || undefined)
      setActivities((prev) => (append ? [...prev, ...result.items] : result.items))
      setTotalPages(result.totalPages)
      setPage(p)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setActivities([])
    const apiSort = sortDir === 'desc' ? `-${sortKey}` : sortKey
    fetchActivities(1, apiSort, collectionFilter)
  }, [sortKey, sortDir, collectionFilter])

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleLoadMore() {
    const nextPage = page + 1
    if (nextPage > totalPages) return
    const apiSort = sortDir === 'desc' ? `-${sortKey}` : sortKey
    fetchActivities(nextPage, apiSort, collectionFilter, true)
  }

  return (
    <>
      <PageHeader title="Activity Log" subtitle="Track all system actions and changes." />

      <div className="mb-4">
        <Select
          value={collectionFilter}
          onValueChange={(v) => setCollectionFilter(v)}
          className="h-9 w-48 text-sm"
        >
          {collectionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={activities}
            loading={loading && activities.length === 0}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onRowClick={(a) => setFlyoutActivity(a)}
            emptyState={
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              </div>
            }
            rowKey={(a) => a.id}
          />
          {activities.length > 0 && page < totalPages && (
            <div className="flex justify-center p-4 border-t">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 motion-press"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <DetailPanel
        open={flyoutActivity !== null}
        onClose={closeFlyout}
        title={flyoutActivity ? `${flyoutActivity.action} — ${flyoutActivity.collection}` : ''}
      >
        {flyoutActivity && (
          <>
            <DetailSection icon={<FileText className="size-3" />} title="Action">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Action:</span> <span className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', actionColors[flyoutActivity.action] || 'bg-muted text-muted-foreground')}>{flyoutActivity.action}</span></div>
                <div><span className="text-muted-foreground">Collection:</span> <span className="capitalize">{flyoutActivity.collection.replace(/_/g, ' ')}</span></div>
              </div>
            </DetailSection>

            <DetailSection icon={<Database className="size-3" />} title="Details">
              <p className="text-sm text-foreground whitespace-pre-wrap">{flyoutActivity.details}</p>
            </DetailSection>

            <DetailSection icon={<User className="size-3" />} title="User">
              <p className="text-sm text-foreground">{flyoutActivity.user_name}</p>
            </DetailSection>

            <DetailSection icon={<Clock className="size-3" />} title="Timestamp">
              <p className="text-sm text-foreground">{formatDateTime(flyoutActivity.created)}</p>
            </DetailSection>

            <DetailSection title="Record ID">
              <p className="text-xs text-muted-foreground font-mono">{flyoutActivity.record_id}</p>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  )
}
