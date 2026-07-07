import { useState, useEffect } from 'react'
import { DollarSign, BookOpen, Calendar, FileText, Building, Receipt, Database, ArrowRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { DataTable, type Column } from '@/components/ui/data-table'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getAppropriations, createAppropriation, updateAppropriation, deleteAppropriation, markAppropriationAsObligated, type ApiAppropriation, type AppropriationData } from '@/api/appropriations'
import { getFundSources, type ApiFundSource } from '@/api/fundSources'
import { getDisbursements, type ApiDisbursement } from '@/api/disbursements'
import { getFinanceAuditLogs, type ApiFinanceAudit } from '@/api/financeAudit'
import { appropriationStatusColors } from '@/lib/statusStyles'
import { ExportDialog } from '@/components/finance/ExportDialog'
import { getCurrentUser } from '@/auth/session'

function getComputedStatus(a: ApiAppropriation): string {
  if (!a.payee) return 'pending'
  if (a.disbursed_amount <= 0) return 'obligated'
  if (a.disbursed_amount < a.appropriated_amount) return 'partially_disbursed'
  return 'fully_disbursed'
}

export function Appropriations() {
  const currentYear = new Date().getFullYear()
  const [appropriations, setAppropriations] = useState<ApiAppropriation[]>([])
  const [fundSources, setFundSources] = useState<ApiFundSource[]>([])
  const [disbursements, setDisbursements] = useState<ApiDisbursement[]>([])
  const [auditLogs, setAuditLogs] = useState<ApiFinanceAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [flyout, setFlyout] = useState<ApiAppropriation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [form, setForm] = useState<AppropriationData>({ fiscal_year: currentYear, fund_source: '', expense_class: 'MOOE', item_name: '', appropriated_amount: 0, notes: '' })
  const [obligateTarget, setObligateTarget] = useState<ApiAppropriation | null>(null)
  const [obligateForm, setObligateForm] = useState({ payee: '', obligated_date: new Date().toISOString().split('T')[0], obligation_notes: '' })

  async function load() {
    setLoading(true)
    try {
      const [apprs, funds] = await Promise.all([
        getAppropriations(),
        getFundSources(),
      ])
      setAppropriations(apprs)
      setFundSources(funds)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function loadDisbursements(apprId: string) {
    try {
      const all = await getDisbursements()
      setDisbursements(all.filter((d) => d.appropriation === apprId))
    } catch (_) {}
  }

  async function loadAuditLogs(apprId: string) {
    try {
      const result = await getFinanceAuditLogs(1, 50, '-created')
      setAuditLogs(result.items.filter((l) => l.record_id === apprId))
    } catch (_) {}
  }

  function handleFlyout(a: ApiAppropriation) {
    setFlyout(a)
    loadDisbursements(a.id)
    loadAuditLogs(a.id)
  }

  function openEditPanel(a: ApiAppropriation) {
    setEditId(a.id)
    setForm({
      fiscal_year: a.fiscal_year,
      fund_source: a.fund_source,
      expense_class: a.expense_class,
      item_name: a.item_name,
      appropriated_amount: a.appropriated_amount,
      notes: a.notes,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (editId) {
      await updateAppropriation(editId, form)
    } else {
      await createAppropriation(form)
    }
    setShowForm(false)
    setEditId(null)
    setForm({ fiscal_year: currentYear, fund_source: '', expense_class: 'MOOE', item_name: '', appropriated_amount: 0, notes: '' })
    load()
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteAppropriation(deleteId)
    setDeleteId(null)
    setFlyout(null)
    load()
  }

  async function handleObligate() {
    if (!obligateTarget) return
    await markAppropriationAsObligated(obligateTarget.id, obligateForm)
    setObligateTarget(null)
    setObligateForm({ payee: '', obligated_date: new Date().toISOString().split('T')[0], obligation_notes: '' })
    load()
  }

  const columns: Column<ApiAppropriation>[] = [
    { key: 'fiscal_year', label: 'Year', sortable: true, filterType: 'text', hideBelow: 'sm' },
    { key: 'item_name', label: 'Item Name', sortable: true, filterType: 'text' },
    { key: 'fund_source', label: 'Fund Source', sortable: true, hideBelow: 'sm', filterType: 'text',
      render: (a) => a.expand?.fund_source?.name ?? a.fund_source ?? '—' },
    { key: 'classification', label: 'Class', hideBelow: 'sm', filterType: 'select',
      filterOptions: [
        { label: 'PS', value: 'PS' },
        { label: 'MOOE', value: 'MOOE' },
        { label: 'CO', value: 'CO' },
      ],
      render: (a) => <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{a.expense_class}</span> },
    { key: 'appropriated_amount', label: 'Appropriated', filterType: 'text',
      render: (a) => `₱${Number(a.appropriated_amount).toLocaleString()}` },
    { key: 'status', label: 'Status', filterType: 'select',
      filterOptions: [
        { label: 'Pending', value: 'pending' },
        { label: 'Obligated', value: 'obligated' },
        { label: 'Partially Disbursed', value: 'partially_disbursed' },
        { label: 'Fully Disbursed', value: 'fully_disbursed' },
      ],
      render: (a) => {
        const status = getComputedStatus(a)
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${appropriationStatusColors[status] ?? ''}`}>{status.replace(/_/g, ' ')}</span>
        )
      }},
    { key: 'payee', label: 'Payee', filterType: 'text', render: (a) => a.payee || '—' },
    { key: 'disbursed_amount', label: 'Disbursed', filterType: 'text',
      render: (a) => `₱${Number(a.disbursed_amount).toLocaleString()}` },
  ]

  return (
    <div>
      <PageHeader title="Appropriations">
        <div className="flex items-center gap-4">
          {getCurrentUser()?.role === 'admin' && (
            <Button variant="outline" onClick={() => setShowExport(true)}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          )}
          <Button onClick={() => { setEditId(null); setForm({ fiscal_year: currentYear, fund_source: '', expense_class: 'MOOE', item_name: '', appropriated_amount: 0, notes: '' }); setShowForm(true) }}>+ Add Appropriation</Button>
        </div>
      </PageHeader>
      
      <DataTable
        columns={columns}
        data={appropriations}
        loading={loading}
        onRowClick={handleFlyout}
        emptyState={<p className="text-center text-muted-foreground py-6">No appropriations found</p>}
        rowKey={(a) => a.id}
        toolbar
        exportable
      />

      <DetailPanel
        open={!!flyout}
        onClose={() => setFlyout(null)}
        title={flyout?.item_name || ''}
        onEdit={flyout ? () => { openEditPanel(flyout); setFlyout(null) } : undefined}
        onDelete={flyout ? () => { setDeleteId(flyout.id); setFlyout(null) } : undefined}
      >
        {flyout && (() => {
          const status = getComputedStatus(flyout)
          const bal = flyout.appropriated_amount - flyout.disbursed_amount
          const fundSource = flyout.expand?.fund_source
          return (
            <>
              <DetailSection icon={<DollarSign className="size-3.5" />} title="Financial Summary">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Appropriated</p>
                    <p className="font-semibold">₱{flyout.appropriated_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Disbursed</p>
                    <p className="font-semibold">₱{flyout.disbursed_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${appropriationStatusColors[status] ?? ''}`}>{status.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={`font-semibold ${bal <= 0 ? 'text-destructive' : ''}`}>₱{bal.toLocaleString()}</p>
                  </div>
                </div>
              </DetailSection>
              <DetailSection icon={<Building className="size-3.5" />} title="Fund Source">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{fundSource?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-mono text-xs">{fundSource?.code || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Balance</span>
                    <span>₱{(fundSource?.original_balance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Balance</span>
                    <span>₱{(fundSource?.current_balance || 0).toLocaleString()}</span>
                  </div>
                </div>
              </DetailSection>
              <DetailSection icon={<BookOpen className="size-3.5" />} title="Item Details">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expense Class</span>
                    <span><span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{flyout.expense_class}</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payee</span>
                    <span>{flyout.payee || '—'}</span>
                  </div>
                  {flyout.obligated_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Obligated Date</span>
                      <span>{flyout.obligated_date}</span>
                    </div>
                  )}
                  {flyout.fully_disbursed_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fully Disbursed</span>
                      <span>{flyout.fully_disbursed_date}</span>
                    </div>
                  )}
                  {status === 'pending' && (
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => { setObligateTarget(flyout); setObligateForm({ payee: '', obligated_date: new Date().toISOString().split('T')[0], obligation_notes: '' }) }}>
                      <ArrowRight className="size-3 mr-1" /> Mark as Obligated
                    </Button>
                  )}
                </div>
              </DetailSection>
              <DetailSection icon={<Receipt className="size-3.5" />} title="Linked Disbursements">
                {disbursements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No disbursements yet</p>
                ) : (
                  <div className="space-y-2">
                    {disbursements.map((d) => (
                      <div key={d.id} className="flex justify-between items-center border-b pb-1 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{d.payee || '—'}</p>
                          <p className="text-xs text-muted-foreground">{d.disbursement_date} {d.check_no ? `• #${d.check_no}` : ''}</p>
                        </div>
                        <span className="font-semibold text-sm">₱{d.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </DetailSection>
              <DetailSection icon={<Database className="size-3.5" />} title="Audit Log">
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No audit entries</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {auditLogs.map((l) => (
                      <div key={l.id} className="flex justify-between items-center text-xs border-b pb-1 last:border-0">
                        <div>
                          <span className={`inline-flex items-center rounded px-1 py-0.5 text-xs font-semibold ${l.action === 'create' ? 'bg-green-100 text-green-700' : l.action === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{l.action}</span>
                          <span className="ml-1 text-muted-foreground">{l.details}</span>
                        </div>
                        <span className="text-muted-foreground">{l.user_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </DetailSection>
              {flyout.notes && (
                <DetailSection icon={<FileText className="size-3.5" />} title="Notes">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyout.notes}</p>
                </DetailSection>
              )}
              <DetailSection icon={<Calendar className="size-3.5" />} title="Metadata">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Created: {new Date(flyout.created).toLocaleString()}</div>
                  <div>Updated: {new Date(flyout.updated).toLocaleString()}</div>
                </div>
              </DetailSection>
            </>
          )
        })()}
      </DetailPanel>

      {obligateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setObligateTarget(null)} />
          <div className="relative w-full max-w-md bg-card rounded-xl shadow-xl p-6 m-4">
            <h2 className="font-display text-sm font-semibold mb-4">Mark as Obligated — {obligateTarget.item_name}</h2>
            <div className="space-y-4">
              <div>
                <Label>Payee</Label>
                <Input value={obligateForm.payee} onChange={(e) => setObligateForm({ ...obligateForm, payee: e.target.value })} placeholder="Name of payee" />
              </div>
              <div>
                <Label>Obligated Date</Label>
                <Input type="date" value={obligateForm.obligated_date} onChange={(e) => setObligateForm({ ...obligateForm, obligated_date: e.target.value })} />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={obligateForm.obligation_notes} onChange={(e) => setObligateForm({ ...obligateForm, obligation_notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleObligate} disabled={!obligateForm.payee}>Confirm</Button>
              <Button variant="outline" onClick={() => setObligateTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={() => { setShowForm(false); setEditId(null) }} />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="p-6">
              <h2 className="font-display text-sm font-semibold mb-4">{editId ? 'Edit' : 'Add'} Appropriation</h2>
              <div className="space-y-4">
                <div>
                  <Label>Fiscal Year</Label>
                  <Input type="number" value={form.fiscal_year || currentYear} onChange={(e) => setForm({ ...form, fiscal_year: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Fund Source</Label>
                  <Select value={form.fund_source || ''} onValueChange={(v) => setForm({ ...form, fund_source: v })}>
                    <option value="">Select fund source</option>
                    {fundSources.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Expense Class</Label>
                  <Select value={form.expense_class || 'MOOE'} onValueChange={(v: any) => setForm({ ...form, expense_class: v })}>
                    <option value="PS">PS (Personnel Services)</option>
                    <option value="MOOE">MOOE (Maintenance & Other Operating Expenses)</option>
                    <option value="CO">CO (Capital Outlay)</option>
                  </Select>
                </div>
                <div>
                  <Label>Item Name</Label>
                  <Input value={form.item_name || ''} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
                </div>
                <div>
                  <Label>Appropriated Amount</Label>
                  <Input type="number" value={form.appropriated_amount || 0} onChange={(e) => setForm({ ...form, appropriated_amount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Appropriation" message="Are you sure? This will also remove related disbursements and restore fund source balance." confirmLabel="Delete" destructive onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        title="Appropriations"
        columns={[
          { header: 'Item Name', key: 'item_name' },
          { header: 'Expense Class', key: 'expense_class' },
          { header: 'Appropriated', key: 'appropriated_amount', format: 'currency' as const },
          { header: 'Disbursed', key: 'disbursed_amount', format: 'currency' as const },
          { header: 'Payee', key: 'payee' },
          { header: 'Status', key: 'status' },
        ]}
        fetchData={async () => {
          const data = await getAppropriations()
          return data.map((a) => {
            const s = !a.payee ? 'pending' : a.disbursed_amount <= 0 ? 'obligated' : a.disbursed_amount < a.appropriated_amount ? 'partially_disbursed' : 'fully_disbursed'
            return {
              item_name: a.item_name,
              expense_class: a.expense_class,
              appropriated_amount: a.appropriated_amount,
              disbursed_amount: a.disbursed_amount,
              payee: a.payee || '',
              status: s,
            }
          })
        }}
        filename="appropriations"
      />
    </div>
  )
}
