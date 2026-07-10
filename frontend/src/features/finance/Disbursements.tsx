import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect } from 'react'
import { Plus, Calendar, DollarSign, FileText, Building, Receipt, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/ui/data-table'
import { DetailPanel, DetailSection, FieldRow } from '@/components/ui/DetailPanel'
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
    try {
      await createDisbursement(form)
      setShowForm(false)
      setForm({ appropriation: '', payee: '', disbursement_date: today(), amount: 0, check_no: '', or_no: '', particular: '' })
      load()
    } catch (_) {}
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteDisbursement(deleteId)
      setDeleteId(null)
      setFlyout(null)
      load()
    } catch (_) {}
  }

  const appropriationMap = Object.fromEntries(appropriations.map((a) => [a.id, a]))

  const columns: Column<ApiDisbursement>[] = [
    { key: 'date', label: 'Date', sortable: true, filterType: 'date', render: (d) => d.disbursement_date ? new Date(d.disbursement_date).toLocaleDateString() : '' },
    { key: 'payee', label: 'Payee', sortable: true, filterType: 'text',
      render: (d) => d.payee || (d.expand?.appropriation as any)?.payee || '—' },
    { key: 'particulars', label: 'Item', filterType: 'text', render: (d) => d.particular ?? '—' },
    { key: 'amount', label: 'Amount', className: 'text-right', filterType: 'text',
      render: (d) => `₱${Number(d.amount).toLocaleString()}` },
    { key: 'check_number', label: 'Check #', filterType: 'text',
      render: (d) => <span className="font-mono text-xs">{d.check_no || '—'}</span> },
    { key: 'reference_number', label: 'OR Number', filterType: 'text',
      render: (d) => <span className="font-mono text-xs">{d.or_no || '—'}</span> },
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
        Record
      </Button>
    </div>
  )

  return (
    <>
      <div className="-ml-4 -mr-4 sm:-ml-6 sm:-mr-6 lg:-ml-8 lg:-mr-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-56px)] h-[calc(100dvh-60px)] md:h-[calc(100dvh-52px)] flex flex-col overflow-hidden">
        <DataTable
          title="DISBURSEMENTS"
          toolbarActions={toolbarActions}
          columns={columns}
          data={disbursements}
          loading={loading}
          onRowClick={(d) => setFlyout(d)}
          emptyState={<p className="text-center text-muted-foreground py-6">No disbursements found</p>}
          rowKey={(d) => d.id}
          toolbar
          exportable
        />
      </div>
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
                <FieldRow label="Amount">
                  <span className="font-semibold text-foreground">₱{flyout.amount.toLocaleString()}</span>
                </FieldRow>
                <FieldRow label="Date" value={flyout.disbursement_date} />
                <FieldRow label="Particular" value={flyout.particular} />
              </DetailSection>
              <DetailSection icon={<Receipt className="size-3.5" />} title="Reference Numbers">
                <FieldRow label="Check No.">
                  <span className="font-mono text-xs text-foreground">{flyout.check_no || '—'}</span>
                </FieldRow>
                <FieldRow label="OR No.">
                  <span className="font-mono text-xs text-foreground">{flyout.or_no || '—'}</span>
                </FieldRow>
              </DetailSection>
              <DetailSection icon={<Building className="size-3.5" />} title="Appropriation">
                <FieldRow label="Payee" value={flyout.payee || '—'} />
                <FieldRow label="Particular" value={flyout.particular || '—'} />
                <FieldRow label="Item" value={appr?.item_name || '—'} />
                <FieldRow label="Fund Source" value={appr?.expand?.fund_source?.name || '—'} />
              </DetailSection>
              {flyout.notes && (
                <DetailSection icon={<FileText className="size-3.5" />} title="Notes">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyout.notes}</p>
                </DetailSection>
              )}
              <DetailSection icon={<Calendar className="size-3.5" />} title="Metadata">
                <FieldRow label="Created" value={new Date(flyout.created).toLocaleString()} />
                <FieldRow label="Updated" value={new Date(flyout.updated).toLocaleString()} />
              </DetailSection>
            </>
          )
        })()}
      </DetailPanel>
      {showForm && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={() => setShowForm(false)} />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:w-1/2 md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl font-display">
            <div className="p-6">
              <h2 className="font-display text-sm font-semibold mb-4">Record Disbursement</h2>
              <div className="space-y-4">
                <div>
                  <Label>Appropriation</Label>
                  <Select value={form.appropriation || ''} onValueChange={(v) => setForm({ ...form, appropriation: v })}>
                    <option value="">Select appropriation</option>
                    {appropriations.filter((a) => a.obligated_date && a.disbursed_amount < a.appropriated_amount).map((a) => {
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
    </>
  )
}
