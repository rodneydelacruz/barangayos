import { useState, useEffect } from 'react'
import { getActivities, type ApiActivity } from '@/api/activity'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { cn, formatDateTime } from '@/lib/utils'

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

const sortFields = ['collection', 'user_name', 'created'] as const
type SortField = (typeof sortFields)[number]

export default function ActivityPage() {
  const [activities, setActivities] = useState<ApiActivity[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('-id')
  const [collectionFilter, setCollectionFilter] = useState('')

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
    fetchActivities(1, sortBy, collectionFilter)
  }, [sortBy, collectionFilter])

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortBy(`-${field}`)
    } else if (sortBy === `-${field}`) {
      setSortBy(field)
    } else {
      setSortBy(field)
    }
  }

  function handleLoadMore() {
    const nextPage = page + 1
    if (nextPage > totalPages) return
    fetchActivities(nextPage, sortBy, collectionFilter, true)
  }

  function sortIndicator(field: SortField) {
    if (sortBy === field) return ' ▲'
    if (sortBy === `-${field}`) return ' ▼'
    return ''
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
          {loading && activities.length === 0 ? (
            <div className="space-y-2 p-4 sm:p-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded border p-3 motion-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Action</th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 sm:px-6 hover:text-foreground"
                      onClick={() => handleSort('collection')}
                    >
                      Collection{sortIndicator('collection')}
                    </th>
                    <th className="px-4 py-3 sm:px-6">Details</th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 sm:px-6 hover:text-foreground"
                      onClick={() => handleSort('user_name')}
                    >
                      User{sortIndicator('user_name')}
                    </th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 sm:px-6 hover:text-foreground"
                      onClick={() => handleSort('created')}
                    >
                      Timestamp{sortIndicator('created')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a, i) => (
                    <tr
                      key={a.id}
                      className="border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up"
                      style={{ '--stagger-index': i } as React.CSSProperties}
                    >
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                            actionColors[a.action] || 'bg-muted text-muted-foreground',
                          )}
                        >
                          {a.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {a.collection}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {a.details}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {a.user_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {formatDateTime(a.created)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {page < totalPages && (
                <div className="flex justify-center p-4">
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
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
