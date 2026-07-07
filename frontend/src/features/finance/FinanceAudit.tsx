import { useState, useEffect } from 'react'
import { Clock, User, Database, FileText } from 'lucide-react'
import { getFinanceAuditLogs, type ApiFinanceAudit } from '@/api/financeAudit'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { cn, formatDateTime } from '@/lib/utils'

const FINANCE_COLLECTIONS = [
  'income_accounts',
  'fund_sources',
  'appropriations',
  'disbursements',
  'revenues',
] as const

const collectionLabels: Record<string, string> = {
  income_accounts: 'Income Accounts',
  fund_sources: 'Fund Sources',
  appropriations: 'Appropriations',
  disbursements: 'Disbursements',
  revenues: 'Revenues',
}

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
  const [loading, setLoading] = useState(true)
  const [flyoutLog, setFlyoutLog] = useState<ApiFinanceAudit | null>(null)

  function closeFlyout() {
    setFlyoutLog(null)
  }

  async function fetchLogs() {
    setLoading(true)
    try {
      const first = await getFinanceAuditLogs(1, 100, '-created')
      const all = [...first.items]
      for (let page = 2; page <= first.totalPages; page += 1) {
        const next = await getFinanceAuditLogs(page, 100, '-created')
        all.push(...next.items)
      }
      setLogs(all)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const columns: Column<ApiFinanceAudit>[] = [
    { key: 'action', label: 'Action', filterType: 'select',
      filterOptions: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
      ],
      render: (a) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${a.action === 'create' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : a.action === 'update' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{a.action}</span>
      ) },
    { key: 'collection_name', label: 'Collection', sortable: true, filterType: 'select',
      filterOptions: [...FINANCE_COLLECTIONS].map((c) => ({ label: collectionLabels[c], value: c })),
      render: (a) => a.collection_name.replace(/_/g, ' ') },
    { key: 'details', label: 'Details', filterType: 'text', render: (a) => a.details ?? '—' },
    { key: 'amount', label: 'Amount', className: 'text-right', filterType: 'text',
      render: (a) => a.amount ? `₱${Number(a.amount).toLocaleString()}` : '—' },
  ]

  return (
    <>
      <PageHeader title="Finance Audit Trail"/>

      

      <Card lifted={false} className="shadow-none">
        
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            onRowClick={(l) => setFlyoutLog(l)}
            emptyState={<p className="text-center text-muted-foreground py-12">No finance activity recorded yet.</p>}
            rowKey={(l) => l.id}
            toolbar
            exportable
          />
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
