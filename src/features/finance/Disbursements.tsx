import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect } from 'react'
import { Plus, Calendar, DollarSign, FileText, Building, Receipt, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { DataTable, type Column } from '@/components/ui/data-table'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getDisbursements, createDisbursement, deleteDisbursement, type ApiDisbursement, type DisbursementData } from '@/api/disbursements'
import { getAppropriations, type ApiAppropriation } from '@/api/appropriations'
import { ExportDialog } from '@/components/finance/ExportDialog'
import { getCurrentUser } from '@/auth/session'

export function Disbursements() {
  const today = () => new Date().toISOString().split('T')[0]
  const [disbursements, setDisbursements] = useState<ApiDisbursement[]>([])
  const [appropriations, setAppropriations] = useState<ApiAppropriation[]>([])
  const [loading, setLoading] = useState(true)
  const [flyout, setFlyout] = useState<ApiDisbursement | null>(null)
  const [showForm, setShowForm] = useState(false)
  useBodyScrollLock(showForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [form, setForm] = useState<DisbursementData>({ appropriation: '', payee: '', disbursement_date: today(), amount: 0, check_no: '', or_no: '', particular: '' })

  async function load() {
    setLoading(true)
    try {
      const [disc, apprs] = await Promise.all([
        getDisbursements(),
        getAppropriations(),
      ])
      setDisbursements(disc)
      setAppropriations(apprs)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    await createDisbursement(form)
    setShowForm(false)
    setForm({ appropriation: '', payee: '', disbursement_date: today(), amount: 0, check_no: '', or_no: '', particular: '' })
    load()
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteDisbursement(deleteId)
    setDeleteId(null)
    setFlyout(null)
    load()
  }

  const totalDisbursed = disbursements.reduce((s, d) => s + d.amount, 0)
  const appropriationMap = Object.fromEntries(appropriations.map((a) => [a.id, a]))

  const columns: Column<ApiDisbursement>[] = [
    { key: 'date', label: 'Date', sortable: true, filterType: 'date', render: (d) => d.disbursement_date ? new Date(d.disbursement_date).toLocaleDateString() : '' },
    { key: 'payee', label: 'Payee', sortable: true, filterType: 'text',
      render: (d) => d.payee || (d.expand?.appropriation as any)?.payee || '—' },
    { key: 'particulars', label: 'Particulars', filterType: 'text', render: (d) => d.particular ?? '—', hideBelow: 'sm' },
    { key: 'amount', label: 'Amount', className: 'text-right', filterType: 'text',
      render: (d) => `₱${Number(d.amount).toLocaleString()}` },
    { key: 'check_number', label: 'Check #', hideBelow: 'sm', filterType: 'text',
      render: (d) => <span className="font-mono text-xs">{d.check_no || '—'}</span> },
    { key: 'reference_number', label: 'OR #', hideBelow: 'sm', filterType: 'text',
      render: (d) => <span className="font-mono text-xs">{d.or_no || '—'}</span> },
  ]

  return (
    <div>
      <PageHeader title="Disbursements">
        <div className="flex items-center gap-2">
          {getCurrentUser()?.role === 'admin' && (
            <Button variant="outline" onClick={() => setShowExport(true)}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Record Disbursement</Button>
        </div>
      </PageHeader>
      
      <DataTable
        columns={columns}
        data={disbursements}
        loading={loading}
        onRowClick={(d) => setFlyout(d)}
        emptyState={<p className="text-center text-muted-foreground py-6">No disbursements found</p>}
        rowKey={(d) => d.id}
        toolbar
        exportable
      />
      <DetailPanel
        open={!!flyout}
        onClose={() => setFlyout(null)}
        title="Disbursement Details"
        onDelete={flyout ? () => { setDeleteId(flyout.id); setFlyout(null) } : undefined}
      >
        {flyout && (() => {
          const appr = flyout.expand?.appropriation || appropriationMap[flyout.appropriation]
          return (
            <>
              <DetailSection icon={<DollarSign className="size-3.5" />} title="Payment Info">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">₱{flyout.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{flyout.disbursement_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Particular</span>
                    <span>{flyout.particular}</span>
                  </div>
                </div>
              </DetailSection>
              <DetailSection icon={<Receipt className="size-3.5" />} title="Reference Numbers">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check No.</span>
                    <span className="font-mono text-xs">{flyout.check_no || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">OR No.</span>
                    <span className="font-mono text-xs">{flyout.or_no || '—'}</span>
                  </div>
                </div>
              </DetailSection>
              <DetailSection icon={<Building className="size-3.5" />} title="Appropriation">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payee</span>
                    <span>{flyout.payee || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Particular</span>
                    <span>{flyout.particular || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item</span>
                    <span>{appr?.item_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fund Source</span>
                    <span>{appr?.expand?.fund_source?.name || '—'}</span>
                  </div>
                </div>
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
      {showForm && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={() => setShowForm(false)} />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="p-6">
              <h2 className="font-display text-sm font-semibold mb-4">Record Disbursement</h2>
              <div className="space-y-4">
                <div>
                  <Label>Appropriation</Label>
                  <Select value={form.appropriation || ''} onValueChange={(v) => setForm({ ...form, appropriation: v })}>
                    <option value="">Select appropriation</option>
                    {appropriations.filter((a) => a.disbursed_amount < a.appropriated_amount).map((a) => {
                      const remaining = a.appropriated_amount - a.disbursed_amount
                      return (
                        <option key={a.id} value={a.id}>
                          {a.item_name} (₱{remaining.toLocaleString()} remaining)
                        </option>
                      )
                    })}
                  </Select>
                </div>
                <div>
                  <Label>Payee</Label>
                  <Input value={form.payee || ''} onChange={(e) => setForm({ ...form, payee: e.target.value })} />
                </div>
                <div>
                  <Label>Disbursement Date</Label>
                  <Input type="date" value={form.disbursement_date || ''} onChange={(e) => setForm({ ...form, disbursement_date: e.target.value })} />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" value={form.amount || 0} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Particular</Label>
                  <Input value={form.particular || ''} onChange={(e) => setForm({ ...form, particular: e.target.value })} />
                </div>
                <div>
                  <Label>Check No.</Label>
                  <Input value={form.check_no || ''} onChange={(e) => setForm({ ...form, check_no: e.target.value })} />
                </div>
                <div>
                  <Label>OR No.</Label>
                  <Input value={form.or_no || ''} onChange={(e) => setForm({ ...form, or_no: e.target.value })} />
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
      <ConfirmDialog open={!!deleteId} title="Delete Disbursement" message="Are you sure? This cannot be undone." confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        title="Disbursements"
        columns={[
          { header: 'Date', key: 'disbursement_date', format: 'date' as const },
          { header: 'Payee', key: 'payee' },
          { header: 'Particular', key: 'particular' },
          { header: 'Amount', key: 'amount', format: 'currency' as const },
          { header: 'Check #', key: 'check_no' },
          { header: 'OR #', key: 'or_no' },
        ]}
        fetchData={async (from, to) => {
          const data = await getDisbursements(from || undefined, to || undefined)
          return data.map((d) => ({
            disbursement_date: d.disbursement_date,
            payee: d.payee,
            particular: d.particular,
            amount: d.amount,
            check_no: d.check_no,
            or_no: d.or_no,
          }))
        }}
        filename="disbursements"
      />
    </div>
  )
}
