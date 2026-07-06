import { useState, useEffect } from 'react'
import { DollarSign, BookOpen, Tag, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { FiscalYearSelector } from '@/components/finance/FiscalYearSelector'
import { ExpenseClassCard } from '@/components/finance/ExpenseClassCard'
import { ComplianceWarning } from '@/components/finance/ComplianceWarning'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import Pagination from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getAppropriations, createAppropriation, updateAppropriation, deleteAppropriation, type ApiAppropriation, type AppropriationData } from '@/api/appropriations'
import { getFundSources, type ApiFundSource } from '@/api/fundSources'
import { getIncomeAccounts, type ApiIncomeAccount } from '@/api/incomeAccounts'
import { getFinanceConfig, type ComplianceWarningItem } from '@/api/settings'

export function BudgetOverview() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [appropriations, setAppropriations] = useState<ApiAppropriation[]>([])
  const [fundSources, setFundSources] = useState<ApiFundSource[]>([])
  const [incomeAccounts, setIncomeAccounts] = useState<ApiIncomeAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [flyout, setFlyout] = useState<ApiAppropriation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<AppropriationData>({ fiscal_year: year, fund_source: '', expense_class: 'MOOE', item_name: '', appropriated_amount: 0, status: 'active', notes: '' })
  const [page, setPage] = useState(1)
  const [complianceWarnings, setComplianceWarnings] = useState<ComplianceWarningItem[]>([])
  const PAGE_SIZE = 25

  useEffect(() => { setForm((f) => ({ ...f, fiscal_year: year })) }, [year])

  async function load() {
    setLoading(true)
    try {
      const [apprs, funds, accts] = await Promise.all([
        getAppropriations(year),
        getFundSources(year),
        getIncomeAccounts(year),
      ])
      setAppropriations(apprs)
      setFundSources(funds)
      setIncomeAccounts(accts)
      const fc = await getFinanceConfig()
      if (fc?.complianceWarnings?.[String(year)]) {
        setComplianceWarnings(fc.complianceWarnings[String(year)])
      } else {
        setComplianceWarnings([])
      }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { setPage(1); load() }, [year])

  const psItems = appropriations.filter((a) => a.expense_class === 'PS')
  const mooeItems = appropriations.filter((a) => a.expense_class === 'MOOE')
  const coItems = appropriations.filter((a) => a.expense_class === 'CO')

  const psAppropriated = psItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const psObligated = psItems.reduce((s, a) => s + a.obligated_amount, 0)
  const psDisbursed = psItems.reduce((s, a) => s + a.disbursed_amount, 0)
  const mooeAppropriated = mooeItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const mooeObligated = mooeItems.reduce((s, a) => s + a.obligated_amount, 0)
  const mooeDisbursed = mooeItems.reduce((s, a) => s + a.disbursed_amount, 0)
  const coAppropriated = coItems.reduce((s, a) => s + a.appropriated_amount, 0)
  const coObligated = coItems.reduce((s, a) => s + a.obligated_amount, 0)
  const coDisbursed = coItems.reduce((s, a) => s + a.disbursed_amount, 0)

  const totalAppropriated = psAppropriated + mooeAppropriated + coAppropriated
  const totalObligated = psObligated + mooeObligated + coObligated
  const totalDisbursed = psDisbursed + mooeDisbursed + coDisbursed
  const totalIncome = incomeAccounts.reduce((s, a) => s + a.budgeted_amount, 0)

  function openEditPanel(a: ApiAppropriation) {
    setEditId(a.id)
    setForm({
      fiscal_year: a.fiscal_year,
      fund_source: a.fund_source,
      expense_class: a.expense_class,
      item_name: a.item_name,
      appropriated_amount: a.appropriated_amount,
      status: a.status,
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
    setForm({ fiscal_year: year, fund_source: '', expense_class: 'MOOE', item_name: '', appropriated_amount: 0, status: 'active', notes: '' })
    load()
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteAppropriation(deleteId)
    setDeleteId(null)
    setFlyout(null)
    load()
  }

  const allItems = [...psItems, ...mooeItems, ...coItems]
  const totalPages = Math.ceil(allItems.length / PAGE_SIZE)
  const paginatedItems = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader title="Budget Overview">
        <div className="flex items-center gap-4">
          <FiscalYearSelector value={year} onChange={setYear} />
          <Button onClick={() => { setEditId(null); setForm({ fiscal_year: year, fund_source: '', expense_class: 'MOOE', item_name: '', appropriated_amount: 0, status: 'active', notes: '' }); setShowForm(true) }}>+ Add Appropriation</Button>
        </div>
      </PageHeader>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total Income', value: totalIncome },
          { label: 'Appropriated', value: totalAppropriated },
          { label: 'Obligated', value: totalObligated },
          { label: 'Disbursed', value: totalDisbursed },
          { label: 'Balance', value: totalAppropriated - totalDisbursed },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-lg border bg-card text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold">₱{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <ComplianceWarning warnings={complianceWarnings} />
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExpenseClassCard title="PS (Personnel Services)" appropriated={psAppropriated} obligated={psObligated} disbursed={psDisbursed} itemCount={psItems.length} />
            <ExpenseClassCard title="MOOE (Maintenance & Other Operating Expenses)" appropriated={mooeAppropriated} obligated={mooeObligated} disbursed={mooeDisbursed} itemCount={mooeItems.length} />
            <ExpenseClassCard title="CO (Capital Outlay)" appropriated={coAppropriated} obligated={coObligated} disbursed={coDisbursed} itemCount={coItems.length} />
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Fund Source</th>
                  <th className="p-3">Class</th>
                  <th className="text-right p-3">Appropriated</th>
                  <th className="text-right p-3">Obligated</th>
                  <th className="text-right p-3">Disbursed</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((a) => (
                  <tr key={a.id} className="cursor-pointer border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up hover:bg-muted/30" onClick={() => setFlyout(a)}>
                    <td className="p-3 font-medium">{a.item_name}</td>
                    <td className="p-3 text-muted-foreground">{a.expand?.fund_source?.name || '—'}</td>
                    <td className="p-3"><span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{a.expense_class}</span></td>
                    <td className="p-3 text-right">₱{a.appropriated_amount.toLocaleString()}</td>
                    <td className="p-3 text-right">₱{a.obligated_amount.toLocaleString()}</td>
                    <td className="p-3 text-right">₱{a.disbursed_amount.toLocaleString()}</td>
                    <td className="p-3 text-right">₱{(a.appropriated_amount - a.disbursed_amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
                {allItems.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No appropriations for {year}</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={allItems.length} onPageChange={setPage} pageSize={PAGE_SIZE} />
        </div>
      )}
      <DetailPanel
        open={!!flyout}
        onClose={() => setFlyout(null)}
        title={flyout?.item_name || ''}
        onEdit={flyout ? () => { openEditPanel(flyout); setFlyout(null) } : undefined}
        onDelete={flyout ? () => { setDeleteId(flyout.id); setFlyout(null) } : undefined}
      >
        {flyout && (() => {
          const bal = flyout.appropriated_amount - flyout.disbursed_amount
          return (
            <>
              <DetailSection icon={<DollarSign className="size-3.5" />} title="Financial Summary">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Appropriated</p>
                    <p className="font-semibold">₱{flyout.appropriated_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Obligated</p>
                    <p className="font-semibold">₱{flyout.obligated_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Disbursed</p>
                    <p className="font-semibold">₱{flyout.disbursed_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={`font-semibold ${bal <= 0 ? 'text-destructive' : ''}`}>₱{bal.toLocaleString()}</p>
                  </div>
                </div>
              </DetailSection>
              <DetailSection icon={<BookOpen className="size-3.5" />} title="Item Details">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fund Source</span>
                    <span>{flyout.expand?.fund_source?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expense Class</span>
                    <span><span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{flyout.expense_class}</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${flyout.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>{flyout.status}</span>
                  </div>
                </div>
              </DetailSection>
              <DetailSection icon={<Tag className="size-3.5" />} title="Fiscal Info">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fiscal Year</span>
                    <span>{flyout.fiscal_year}</span>
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
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={() => { setShowForm(false); setEditId(null) }} />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="p-6">
              <h2 className="text-sm font-semibold mb-4">{editId ? 'Edit' : 'Add'} Appropriation</h2>
              <div className="space-y-4">
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
                  <Label>Status</Label>
                  <Select value={form.status || 'active'} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </Select>
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
      <ConfirmDialog open={!!deleteId} title="Delete Appropriation" message="Are you sure? This will also remove related obligations and disbursements." confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  )
}
