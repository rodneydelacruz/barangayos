import { useState, useEffect } from 'react'
import { Plus, DollarSign, Calendar, Tag, FileText, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import Pagination from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getRevenues, createRevenue, deleteRevenue, type ApiRevenue, type RevenueData } from '@/api/revenues'
import { getIncomeAccounts, type ApiIncomeAccount } from '@/api/incomeAccounts'

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

const PAGE_SIZE = 25

export function RevenueTracking() {
  const today = () => new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState('all')
  const [revenues, setRevenues] = useState<ApiRevenue[]>([])
  const [incomeAccounts, setIncomeAccounts] = useState<ApiIncomeAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [flyout, setFlyout] = useState<ApiRevenue | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<RevenueData>({ revenue_date: today(), income_account: '', category: 'document_fee', source: '', amount: 0, or_no: '', remarks: '' })

  async function load() {
    setLoading(true)
    try {
      const [revs, accts] = await Promise.all([
        getRevenues(startDate || undefined, endDate || undefined, category === 'all' ? undefined : category),
        getIncomeAccounts(),
      ])
      setRevenues(revs)
      setIncomeAccounts(accts)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [startDate, endDate, category])

  async function handleSave() {
    await createRevenue(form)
    setShowForm(false)
    setForm({ revenue_date: today(), income_account: '', category: 'document_fee', source: '', amount: 0, or_no: '', remarks: '' })
    load()
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteRevenue(deleteId)
    setDeleteId(null)
    setFlyout(null)
    load()
  }

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0)
  const totalPages = Math.ceil(revenues.length / PAGE_SIZE)

  return (
    <div>
      <PageHeader title="Revenue Tracking">
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Add Revenue</Button>
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
        <Select value={category} onValueChange={setCategory} className="w-44">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        <div className="text-sm text-muted-foreground ml-auto">Total: <span className="font-semibold">₱{totalRevenue.toLocaleString()}</span></div>
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
                  <th className="p-3">Source</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Income Account</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="p-3">OR #</th>
                </tr>
              </thead>
              <tbody>
                {revenues.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="cursor-pointer border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up hover:bg-muted/30" onClick={() => setFlyout(r)}>
                    <td className="p-3">{r.revenue_date}</td>
                    <td className="p-3">{r.source}</td>
                    <td className="p-3"><span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{CATEGORY_LABELS[r.category] || r.category}</span></td>
                    <td className="p-3 text-muted-foreground">{r.expand?.income_account?.name || '—'}</td>
                    <td className="p-3 text-right font-medium">₱{r.amount.toLocaleString()}</td>
                    <td className="p-3 font-mono text-xs">{r.or_no || '—'}</td>
                  </tr>
                ))}
                {revenues.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No revenue records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={revenues.length} onPageChange={setPage} />
        </>
      )}
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
              </div>
            </DetailSection>
            <DetailSection icon={<Receipt className="size-3.5" />} title="Reference">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OR No.</span>
                  <span className="font-mono text-xs">{flyout.or_no || '—'}</span>
                </div>
                {flyout.document_request && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Document Request</span>
                    <span className="text-xs">#{flyout.document_request}</span>
                  </div>
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
              <h2 className="text-sm font-semibold mb-4">Add Revenue</h2>
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
    </div>
  )
}
