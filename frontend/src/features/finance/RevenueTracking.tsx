import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect } from 'react'
import { Plus, DollarSign, Calendar, Tag, FileText, Receipt, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/ui/data-table'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getRevenues, createRevenue, deleteRevenue, type ApiRevenue, type RevenueData } from '@/api/revenues'
import { getIncomeAccounts, type ApiIncomeAccount } from '@/api/incomeAccounts'
import { getFundSources, type ApiFundSource } from '@/api/fundSources'
import { ExportDialog } from '@/components/finance/ExportDialog'
import { getCurrentUser } from '@/auth/session'

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'nta_receipt', label: 'NTA Receipt' },
  { value: 'tax_receipt', label: 'Tax Receipt' },
  { value: 'other_receipt', label: 'Other Receipt' },
  { value: 'document_fee', label: 'Document Fee' },
  { value: 'donation', label: 'Donation' },
  { value: 'grant', label: 'Grant' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_LABELS: Record<string, string> = {
  nta_receipt: 'NTA Receipt', tax_receipt: 'Tax Receipt', other_receipt: 'Other Receipt',
  document_fee: 'Document Fee', donation: 'Donation', grant: 'Grant', other: 'Other',
}

export function RevenueTracking() {
  const today = () => new Date().toISOString().split('T')[0]
  const [revenues, setRevenues] = useState<ApiRevenue[]>([])
  const [incomeAccounts, setIncomeAccounts] = useState<ApiIncomeAccount[]>([])
  const [fundSources, setFundSources] = useState<ApiFundSource[]>([])
  const [loading, setLoading] = useState(true)
  const [flyout, setFlyout] = useState<ApiRevenue | null>(null)
  const [showForm, setShowForm] = useState(false)
  useBodyScrollLock(showForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [form, setForm] = useState<RevenueData>({ revenue_date: today(), income_account: '', fund_source: '', category: 'document_fee', source: '', amount: 0, or_no: '', remarks: '' })

  async function load() {
    setLoading(true)
    try {
      const [revs, accts, funds] = await Promise.all([
        getRevenues(),
        getIncomeAccounts(),
        getFundSources(),
      ])
      setRevenues(revs)
      setIncomeAccounts(accts)
      setFundSources(funds)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    try {
      await createRevenue(form)
      setShowForm(false)
      setForm({ revenue_date: today(), income_account: '', fund_source: '', category: 'document_fee', source: '', amount: 0, or_no: '', remarks: '' })
      load()
    } catch (_) {}
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteRevenue(deleteId)
      setDeleteId(null)
      setFlyout(null)
      load()
    } catch (_) {}
  }

  const columns: Column<ApiRevenue>[] = [
    { key: 'date', label: 'Date', sortable: true, filterType: 'date', render: (r) => r.revenue_date ? new Date(r.revenue_date).toLocaleDateString() : '' },
    { key: 'source', label: 'Source', sortable: true, filterType: 'text' },
    { key: 'category', label: 'Category', sortable: true, filterType: 'select',
      filterOptions: CATEGORIES.filter((c) => c.value !== 'all').map((c) => ({ label: c.label, value: c.value })),
      render: (r) => <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{CATEGORY_LABELS[r.category] || r.category}</span> },
    { key: 'income_account', label: 'Income Account', hideBelow: 'sm',
      render: (r) => r.expand?.income_account?.name ?? r.income_account ?? '—' },
    { key: 'fund_source', label: 'Fund Source', hideBelow: 'sm',
      render: (r) => r.expand?.fund_source?.name ?? '—' },
    { key: 'amount', label: 'Amount', className: 'text-right', filterType: 'text',
      render: (r) => `₱${Number(r.amount).toLocaleString()}` },
    { key: 'reference_number', label: 'Reference #', filterType: 'text',
      render: (r) => <span className="font-mono text-xs">{r.or_no || '—'}</span> },
  ]

  const toolbarActions = (
    <div className="flex items-center gap-1">
      {getCurrentUser()?.role === 'admin' && (
        <Button variant="ghost" size="sm" className="h-6 text-xs gap-0.5" onClick={() => setShowExport(true)}>
          <Download className="size-3" /> Export
        </Button>
      )}
      <Button variant="ghost" size="sm" className="gap-0.5 rounded-md text-blue-400 hover:text-blue-300 h-6 text-xs" onClick={() => setShowForm(true)}>
        <Plus className="size-3" />
        Add
      </Button>
    </div>
  )

  return (
    <>
      <div className="-ml-4 -mr-4 sm:-ml-6 sm:-mr-6 lg:-ml-8 lg:-mr-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-56px)] h-[calc(100dvh-60px)] md:h-[calc(100dvh-52px)] flex flex-col overflow-hidden">
        <DataTable
          title="REVENUE TRACKING"
          toolbarActions={toolbarActions}
          columns={columns}
          data={revenues}
          loading={loading}
          onRowClick={(r) => setFlyout(r)}
          emptyState={<p className="text-center text-muted-foreground py-6">No revenue records found</p>}
          rowKey={(r) => r.id}
          toolbar
          exportable
        />
      </div>
      <DetailPanel
        open={!!flyout}
        onClose={() => setFlyout(null)}
        title="Revenue Details"
        onDelete={flyout ? () => { setDeleteId(flyout.id); setFlyout(null) } : undefined}
      >
        {flyout && (() => (
          <>
            <DetailSection icon={<DollarSign className="size-3.5" />} title="Revenue Info">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">₱{flyout.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{flyout.revenue_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span>{flyout.source}</span>
                </div>
              </div>
            </DetailSection>
            <DetailSection icon={<Tag className="size-3.5" />} title="Classification">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{CATEGORY_LABELS[flyout.category] || flyout.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Income Account</span>
                  <span>{flyout.expand?.income_account?.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COA Code</span>
                  <span className="font-mono text-xs">{flyout.expand?.income_account?.coa_code || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fund Source</span>
                  <span>{flyout.expand?.fund_source?.name || '—'}</span>
                </div>
              </div>
            </DetailSection>
            <DetailSection icon={<Receipt className="size-3.5" />} title="Reference">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OR No.</span>
                  <span className="font-mono text-xs">{flyout.or_no || '—'}</span>
                </div>
                {flyout.expand?.document_request && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Document Request</span>
                      <span className="text-xs">#{flyout.document_request}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Received By</span>
                      <span>{(flyout.expand.document_request as Record<string, unknown>)?.received_by as string || '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </DetailSection>
            {flyout.remarks && (
              <DetailSection icon={<FileText className="size-3.5" />} title="Remarks">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyout.remarks}</p>
              </DetailSection>
            )}
            <DetailSection icon={<Calendar className="size-3.5" />} title="Metadata">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Created: {new Date(flyout.created).toLocaleString()}</div>
                <div>Updated: {new Date(flyout.updated).toLocaleString()}</div>
              </div>
            </DetailSection>
          </>
        ))()}
      </DetailPanel>
      {showForm && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={() => setShowForm(false)} />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="p-6">
              <h2 className="font-display text-sm font-semibold mb-4">Add Revenue</h2>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.revenue_date || ''} onChange={(e) => setForm({ ...form, revenue_date: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category || 'other'} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                    {CATEGORIES.filter((c) => c.value !== 'all').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Income Account</Label>
                  <Select value={form.income_account || ''} onValueChange={(v) => setForm({ ...form, income_account: v })}>
                    <option value="">Select account</option>
                    {incomeAccounts.map((a) => <option key={a.id} value={a.id}>{a.coa_code} — {a.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Fund Source</Label>
                  <Select value={form.fund_source || ''} onValueChange={(v) => setForm({ ...form, fund_source: v })}>
                    <option value="">Select fund source</option>
                    {fundSources.filter((f) => f.is_active).map((f) => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Input value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })} />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" value={form.amount || 0} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>OR No.</Label>
                  <Input value={form.or_no || ''} onChange={(e) => setForm({ ...form, or_no: e.target.value })} />
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Input value={form.remarks || ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSave}>Create</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Revenue" message="Are you sure? This cannot be undone." confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        title="Revenues"
        columns={[
          { header: 'Date', key: 'revenue_date', format: 'date' as const },
          { header: 'Source', key: 'source' },
          { header: 'Category', key: 'category' },
          { header: 'Amount', key: 'amount', format: 'currency' as const },
          { header: 'OR #', key: 'or_no' },
        ]}
        fetchData={async (from, to) => {
          const data = await getRevenues(from || undefined, to || undefined)
          return data.map((r) => ({
            revenue_date: r.revenue_date,
            source: r.source,
            category: r.category,
            amount: r.amount,
            or_no: r.or_no,
          }))
        }}
        filename="revenues"
      />
    </>
  )
}
