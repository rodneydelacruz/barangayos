import { useState, useEffect } from 'react'
import { Clock, User, Database, FileText, Filter } from 'lucide-react'
import { getFinanceAuditLogs, type ApiFinanceAudit } from '@/api/financeAudit'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import Pagination from '@/components/ui/Pagination'
import { cn, formatDateTime } from '@/lib/utils'

const FINANCE_COLLECTIONS = [
  'income_accounts',
  'fund_sources',
  'appropriations',
  'obligations',
  'disbursements',
  'revenues',
] as const

const collectionLabels: Record<string, string> = {
  income_accounts: 'Income Accounts',
  fund_sources: 'Fund Sources',
  appropriations: 'Appropriations',
  obligations: 'Obligations',
  disbursements: 'Disbursements',
  revenues: 'Revenues',
}

const collectionOptions = [
  { value: '', label: 'All Finance' },
  ...FINANCE_COLLECTIONS.map((c) => ({ value: c, label: collectionLabels[c] })),
]

const actionColors: Record<string, string> = {
  create: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  update: 'bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  delete: 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

function formatPeso(n: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n)
}

export function FinanceAudit() {
  const [logs, setLogs] = useState<ApiFinanceAudit[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [collectionFilter, setCollectionFilter] = useState('')
  const [flyoutLog, setFlyoutLog] = useState<ApiFinanceAudit | null>(null)

  function closeFlyout() {
    setFlyoutLog(null)
  }

  async function fetchLogs(p: number, collectionName: string) {
    setLoading(true)
    try {
      const result = await getFinanceAuditLogs(p, 25, '-created', collectionName || undefined)
      setLogs(result.items)
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
    setLogs([])
    fetchLogs(1, collectionFilter)
  }, [collectionFilter])

  function handlePageChange(newPage: number) {
    fetchLogs(newPage, collectionFilter)
  }

  const totalAmount = logs.reduce((s, l) => s + (l.amount || 0), 0)

  return (
    <>
      <PageHeader title="Finance Audit Trail" subtitle="Track all financial transactions and changes." />

      <div className="mb-4 flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <Select
          value={collectionFilter}
          onValueChange={(v) => setCollectionFilter(v)}
          className="h-9 w-52 text-sm"
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
          <div className="flex items-center justify-between">
            <CardTitle>Finance Activity Log</CardTitle>
            {totalAmount > 0 && (
              <span className="text-sm text-muted-foreground">
                Total amount shown: <span className="font-semibold text-foreground">{formatPeso(totalAmount)}</span>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && logs.length === 0 ? (
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
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No finance activity recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Action</th>
                    <th className="px-4 py-3 sm:px-6">Collection</th>
                    <th className="px-4 py-3 sm:px-6">Details</th>
                    <th className="px-4 py-3 sm:px-6">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr
                      key={l.id}
                      className="cursor-pointer border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up hover:bg-muted/30 transition-colors"
                      style={{ '--stagger-index': i } as React.CSSProperties}
                      onClick={() => setFlyoutLog(l)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <span
                          className={cn(
                            'inline-flex rounded-md px-3.5 py-0.5 text-xs font-bold',
                            actionColors[l.action] || 'bg-muted text-muted-foreground',
                          )}
                        >
                          {l.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {collectionLabels[l.collection_name] || l.collection_name}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {l.details}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {l.amount ? formatPeso(l.amount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="border-t p-4">
                  <Pagination page={page} totalPages={totalPages} totalItems={logs.length} onPageChange={handlePageChange} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DetailPanel
        open={flyoutLog !== null}
        onClose={closeFlyout}
        title={flyoutLog ? `${flyoutLog.action} — ${collectionLabels[flyoutLog.collection_name] || flyoutLog.collection_name}` : ''}
      >
        {flyoutLog && (
          <>
            <DetailSection icon={<FileText className="size-3" />} title="Action">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Action:</span> <span className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', actionColors[flyoutLog.action] || 'bg-muted text-muted-foreground')}>{flyoutLog.action}</span></div>
                <div><span className="text-muted-foreground">Collection:</span> <span>{collectionLabels[flyoutLog.collection_name] || flyoutLog.collection_name}</span></div>
              </div>
            </DetailSection>

            <DetailSection icon={<Database className="size-3" />} title="Details">
              <p className="text-sm text-foreground whitespace-pre-wrap">{flyoutLog.details}</p>
            </DetailSection>

            {flyoutLog.amount ? (
              <DetailSection title="Amount">
                <p className="text-sm font-semibold text-foreground">{formatPeso(flyoutLog.amount)}</p>
              </DetailSection>
            ) : null}

            <DetailSection icon={<User className="size-3" />} title="User">
              <p className="text-sm text-foreground">{flyoutLog.user_name}</p>
            </DetailSection>

            <DetailSection icon={<Clock className="size-3" />} title="Timestamp">
              <p className="text-sm text-foreground">{formatDateTime(flyoutLog.created)}</p>
            </DetailSection>

            <DetailSection title="Record ID">
              <p className="text-xs text-muted-foreground font-mono">{flyoutLog.record_id}</p>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  )
}
