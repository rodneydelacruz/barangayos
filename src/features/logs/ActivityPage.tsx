import { useEffect, useState, useCallback, useRef } from 'react'
import { User, Clock, Database, FileText } from 'lucide-react'
import { getActivities, type ApiActivity } from '@/api/activity'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { cn, formatDateTime } from '@/lib/utils'
import { DataTable, type Column } from '@/components/ui/data-table'

const collectionOptions = [
  { label: 'Residents', value: 'residents' },
  { label: 'Households', value: 'households' },
  { label: 'Document Requests', value: 'document_requests' },
  { label: 'Blotter Records', value: 'blotter_records' },
  { label: 'Visitor Logs', value: 'visitor_logs' },
]

const actionOptions = [
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
]

const actionColors: Record<string, string> = {
  create: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  update: 'bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  delete: 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const MAX_ACTIVITY_ROWS = 250

const columns: Column<ApiActivity>[] = [
  {
    key: 'action',
    label: 'Action',
    filterType: 'select',
    filterOptions: actionOptions,
    render: (activity) => (
      <span className={cn('inline-flex rounded-md px-3.5 py-0.5 text-xs font-bold', actionColors[activity.action] || 'bg-muted text-muted-foreground')}>
        {activity.action}
      </span>
    ),
  },
  {
    key: 'collection',
    label: 'Collection',
    sortable: true,
    filterType: 'select',
    filterOptions: collectionOptions,
    render: (activity) => activity.collection?.replace(/_/g, ' ') ?? '-',
  },
  {
    key: 'details',
    label: 'Details',
    filterType: 'text',
    render: (activity) => activity.details ?? '-',
  },
  {
    key: 'user_name',
    label: 'User',
    sortable: true,
    filterType: 'text',
  },
  {
    key: 'created',
    label: 'Timestamp',
    sortable: true,
    render: (activity) => (activity.created ? formatDateTime(activity.created) : ''),
  },
]

export default function ActivityPage() {
  const [activities, setActivities] = useState<ApiActivity[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<string>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [flyoutActivity, setFlyoutActivity] = useState<ApiActivity | null>(null)

  function closeFlyout() {
    setFlyoutActivity(null)
  }

  const fetchIdRef = useRef(0)

  const fetchActivities = useCallback(async (p: number, sort: string, append = false, fetchId?: number) => {
    setLoading(true)
    try {
      const result = await getActivities(p, 25, sort)
      if (fetchId !== undefined && fetchId !== fetchIdRef.current) return
      setActivities((prev) => {
        const next = append ? [...prev, ...result.items] : result.items
        return next.slice(0, MAX_ACTIVITY_ROWS)
      })
      setTotalPages(result.totalPages)
      setPage(p)
    } catch {
      // silent
    } finally {
      if (fetchId === undefined || fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const fetchId = ++fetchIdRef.current
    setPage(1)
    setActivities([])
    const apiSort = sortDir === 'desc' ? `-${sortKey}` : sortKey
    fetchActivities(1, apiSort, false, fetchId)
  }, [sortKey, sortDir, fetchActivities])

  function handleLoadMore() {
    if (loadingMoreRef.current) return
    const nextPage = page + 1
    if (nextPage > totalPages) return
    loadingMoreRef.current = true
    const apiSort = sortDir === 'desc' ? `-${sortKey}` : sortKey
    fetchActivities(nextPage, apiSort, true, fetchIdRef.current).finally(() => {
      loadingMoreRef.current = false
    })
  }

  const sortKeyRef = useRef(sortKey)
  sortKeyRef.current = sortKey
  const loadingMoreRef = useRef(false)

  const handleSort = useCallback((key: string) => {
    if (key === sortKeyRef.current) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [])

  return (
    <>
      <PageHeader title="Activity Log" subtitle="Track all system actions and changes." />

      <Card lifted={false} className="shadow-none">
        
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={activities}
            loading={loading && activities.length === 0}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onRowClick={(activity) => setFlyoutActivity(activity)}
            emptyState={
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              </div>
            }
            rowKey={(activity) => activity.id}
            pageSize={25}
          />
          {activities.length > 0 && page < totalPages && (
            <div className="flex justify-center border-t p-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="motion-press inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
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
        title={flyoutActivity ? `${flyoutActivity.action} - ${flyoutActivity.collection}` : ''}
      >
        {flyoutActivity && (
          <>
            <DetailSection icon={<FileText className="size-3" />} title="Action">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Action:</span>{' '}
                  <span className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', actionColors[flyoutActivity.action] || 'bg-muted text-muted-foreground')}>
                    {flyoutActivity.action}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Collection:</span>{' '}
                  <span className="capitalize">{flyoutActivity.collection.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </DetailSection>

            <DetailSection icon={<Database className="size-3" />} title="Details">
              <p className="whitespace-pre-wrap text-sm text-foreground">{flyoutActivity.details}</p>
            </DetailSection>

            <DetailSection icon={<User className="size-3" />} title="User">
              <p className="text-sm text-foreground">{flyoutActivity.user_name}</p>
            </DetailSection>

            <DetailSection icon={<Clock className="size-3" />} title="Timestamp">
              <p className="text-sm text-foreground">{formatDateTime(flyoutActivity.created)}</p>
            </DetailSection>

            <DetailSection title="Record ID">
              <p className="font-mono text-xs text-muted-foreground">{flyoutActivity.record_id}</p>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  )
}
