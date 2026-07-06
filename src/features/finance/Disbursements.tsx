import { useState, useEffect } from 'react'
import { Plus, Calendar, DollarSign, FileText, Building, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import Pagination from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getDisbursements, createDisbursement, deleteDisbursement, type ApiDisbursement, type DisbursementData } from '@/api/disbursements'
import { getObligations, type ApiObligation } from '@/api/obligations'
import { getAppropriations, type ApiAppropriation } from '@/api/appropriations'

const PAGE_SIZE = 25

export function Disbursements() {
  const today = () => new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [disbursements, setDisbursements] = useState<ApiDisbursement[]>([])
  const [obligations, setObligations] = useState<ApiObligation[]>([])
  const [appropriations, setAppropriations] = useState<ApiAppropriation[]>([])
  const [loading, setLoading] = useState(true)
  const [flyout, setFlyout] = useState<ApiDisbursement | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<DisbursementData>({ obligation: '', disbursement_date: today(), amount: 0, check_no: '', or_no: '', particular: '' })

  async function load() {
    setLoading(true)
    try {
      const [disc, obls, apprs] = await Promise.all([
        getDisbursements(startDate || undefined, endDate || undefined),
        getObligations(),
        getAppropriations(),
      ])
      setDisbursements(disc)
      setObligations(obls)
      setAppropriations(apprs)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [startDate, endDate])

  async function handleSave() {
    await createDisbursement(form)
    setShowForm(false)
    setForm({ obligation: '', disbursement_date: today(), amount: 0, check_no: '', or_no: '', particular: '' })
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
  const totalPages = Math.ceil(disbursements.length / PAGE_SIZE)

  const obligationMap = Object.fromEntries(obligations.map((o) => [o.id, o]))
  const appropriationMap = Object.fromEntries(appropriations.map((a) => [a.id, a]))

  return (
    <div>
      <PageHeader title="Disbursements">
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Record Disbursement</Button>
      </PageHeader>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs">From</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">To</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        </div>
        <div className="text-sm text-muted-foreground ml-auto">Total Disbursed: <span className="font-semibold">₱{totalDisbursed.toLocaleString()}</span></div>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                  <th className="p-3">Date</th>
                  <th className="p-3">Payee</th>
                  <th className="p-3">Particular</th>
                  <th className="p-3">Appropriation</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="p-3">Check #</th>
                  <th className="p-3">OR #</th>
                </tr>
              </thead>
              <tbody>
                {disbursements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((d) => {
                  const obl = d.expand?.obligation || obligationMap[d.obligation]
                  const appr = obl ? appropriationMap[(obl as any).appropriation] : null
                  return (
                    <tr key={d.id} className="cursor-pointer border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up hover:bg-muted/30" onClick={() => setFlyout(d)}>
                      <td className="p-3">{d.disbursement_date}</td>
                      <td className="p-3">{obl?.payee || '—'}</td>
                      <td className="p-3 text-muted-foreground">{d.particular}</td>
                      <td className="p-3 text-xs text-muted-foreground">{appr?.item_name || '—'}</td>
                      <td className="p-3 text-right font-medium">₱{d.amount.toLocaleString()}</td>
                      <td className="p-3 font-mono text-xs">{d.check_no || '—'}</td>
                      <td className="p-3 font-mono text-xs">{d.or_no || '—'}</td>
                    </tr>
                  )
                })}
                {disbursements.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No disbursements found</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={disbursements.length} onPageChange={setPage} />
        </>
      )}
      <DetailPanel
        open={!!flyout}
        onClose={() => setFlyout(null)}
        title="Disbursement Details"
        onDelete={flyout ? () => { setDeleteId(flyout.id); setFlyout(null) } : undefined}
      >
        {flyout && (() => {
          const obl = flyout.expand?.obligation || obligationMap[flyout.obligation]
          const appr = obl ? appropriationMap[(obl as any).appropriation] : null
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
              <DetailSection icon={<Building className="size-3.5" />} title="Obligation">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payee</span>
                    <span>{obl?.payee || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Particulars</span>
                    <span>{obl?.particulars || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Appropriation</span>
                    <span>{appr?.item_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Obligation Status</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10">{obl?.status || '—'}</span>
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
              <h2 className="text-sm font-semibold mb-4">Record Disbursement</h2>
              <div className="space-y-4">
                <div>
                  <Label>Obligation</Label>
                  <Select value={form.obligation || ''} onValueChange={(v) => setForm({ ...form, obligation: v })}>
                    <option value="">Select obligation</option>
                    {obligations.filter((o) => o.status !== 'fully_disbursed').map((o) => {
                      const appr = appropriationMap[o.appropriation]
                      const remaining = o.amount - o.disbursed_amount
                      return (
                        <option key={o.id} value={o.id}>
                          {appr?.item_name || '—'} — {o.payee} (₱{remaining.toLocaleString()} remaining)
                        </option>
                      )
                    })}
                  </Select>
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
    </div>
  )
}
