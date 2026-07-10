import { useState, useEffect } from 'react'
import { Clock, User, Database, FileText } from 'lucide-react'
import { getFinanceAuditLogs, type ApiFinanceAudit } from '@/api/financeAudit'
import { DataTable, type Column } from '@/components/ui/data-table'
import { DetailPanel, DetailSection, FieldRow } from '@/components/ui/DetailPanel'
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
        <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${a.action === 'create' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : a.action === 'update' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{a.action}</span>
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
      <div className="-ml-4 -mr-4 sm:-ml-6 sm:-mr-6 lg:-ml-8 lg:-mr-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-56px)] h-[calc(100dvh-60px)] md:h-[calc(100dvh-52px)] flex flex-col overflow-hidden">
        <DataTable
          title="FINANCE AUDIT TRAIL"
          columns={columns}
          data={logs}
          loading={loading}
          onRowClick={(l) => setFlyoutLog(l)}
          emptyState={<p className="text-center text-muted-foreground py-12">No finance activity recorded yet.</p>}
          rowKey={(l) => l.id}
          toolbar
          exportable
        />
      </div>

      <DetailPanel
        open={flyoutLog !== null}
        onClose={closeFlyout}
        title={flyoutLog ? `${flyoutLog.action} — ${collectionLabels[flyoutLog.collection_name] || flyoutLog.collection_name}` : ''}
      >
        {flyoutLog && (
          <>
            <DetailSection icon={<FileText className="size-3" />} title="Action">
              <FieldRow label="Action">
                <span className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', actionColors[flyoutLog.action] || 'bg-muted text-muted-foreground')}>{flyoutLog.action}</span>
              </FieldRow>
              <FieldRow label="Collection" value={collectionLabels[flyoutLog.collection_name] || flyoutLog.collection_name} />
            </DetailSection>

            <DetailSection icon={<Database className="size-3" />} title="Details">
              <p className="text-sm text-foreground whitespace-pre-wrap">{flyoutLog.details}</p>
            </DetailSection>

            {flyoutLog.amount ? (
              <DetailSection title="Amount">
                <FieldRow label="Amount" value={formatPeso(flyoutLog.amount)} />
              </DetailSection>
            ) : null}

            <DetailSection icon={<User className="size-3" />} title="User">
              <FieldRow label="Name" value={flyoutLog.user_name} />
            </DetailSection>

            <DetailSection icon={<Clock className="size-3" />} title="Timestamp">
              <FieldRow label="Created" value={formatDateTime(flyoutLog.created)} />
            </DetailSection>

            <DetailSection title="Record ID">
              <FieldRow label="Record ID">
                <span className="font-mono text-xs text-foreground">{flyoutLog.record_id}</span>
              </FieldRow>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  )
}
