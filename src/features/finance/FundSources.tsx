import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect } from 'react'
import { Plus, Landmark, DollarSign, Calendar, FileText, Scale, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { DataTable, type Column } from '@/components/ui/data-table'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getFundSources, createFundSource, updateFundSource, deleteFundSource, type ApiFundSource, type FundSourceData } from '@/api/fundSources'
import { getFinanceAuditLogs, type ApiFinanceAudit } from '@/api/financeAudit'
import { ExportDialog } from '@/components/finance/ExportDialog'
import { getCurrentUser } from '@/auth/session'

const STATUTORY_LABELS: Record<string, string> = {
  none: 'General',
  '20%_DF': '20% Development Fund',
  SK: 'SK Fund',
  BDRRMF: 'BDRRM Fund',
  GAD: 'Gender & Development',
}

export function FundSources() {
  const currentYear = new Date().getFullYear()
  const [sources, setSources] = useState<ApiFundSource[]>([])
  const [loading, setLoading] = useState(true)
  const [flyout, setFlyout] = useState<ApiFundSource | null>(null)
  const [showForm, setShowForm] = useState(false)
  useBodyScrollLock(showForm)
  const [editing, setEditing] = useState<ApiFundSource | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<ApiFinanceAudit[]>([])
  const [showExport, setShowExport] = useState(false)
  const [form, setForm] = useState<FundSourceData>({
    name: '', code: '', statutory_rule: 'none', current_balance: 0, fiscal_year: currentYear, is_active: true, description: '', notes: '',
  })

  async function load() {
    setLoading(true)
    try { setSources(await getFundSources()) } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function loadAuditLogs(fundId: string) {
    try {
      const result = await getFinanceAuditLogs(1, 50, '-created', 'fund_sources')
      setAuditLogs(result.items.filter((l) => l.record_id === fundId))
    } catch (_) {}
  }

  function openEditPanel(s: ApiFundSource) {
    setEditing(s)
    setForm({
      name: s.name, code: s.code, statutory_rule: s.statutory_rule,
      current_balance: s.current_balance, fiscal_year: s.fiscal_year,
      is_active: s.is_active, description: s.description, notes: s.notes,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (editing) {
      await updateFundSource(editing.id, form)
    } else {
      await createFundSource(form)
    }
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', code: '', statutory_rule: 'none', current_balance: 0, fiscal_year: currentYear, is_active: true, description: '', notes: '' })
    load()
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteFundSource(deleteId)
    setDeleteId(null)
    setFlyout(null)
    load()
  }

  const columns: Column<ApiFundSource>[] = [
    { key: 'fiscal_year', label: 'Year', sortable: true, filterType: 'text', hideBelow: 'sm' },
    { key: 'name', label: 'Name', sortable: true, filterType: 'text' },
    { key: 'code', label: 'Code', sortable: true, hideBelow: 'sm', filterType: 'text' },
    { key: 'statutory_rule', label: 'Statutory Rule', filterType: 'select',
      filterOptions: [
        { label: 'General', value: 'none' },
        { label: '20% Development Fund', value: '20%_DF' },
        { label: 'SK Fund', value: 'SK' },
        { label: 'BDRRM Fund', value: 'BDRRMF' },
        { label: 'Gender & Development', value: 'GAD' },
      ],
      render: (f) => f.statutory_rule ?? '—' },
    { key: 'balance', label: 'Balance', className: 'text-right', filterType: 'text',
      render: (f) => `₱${Number(f.current_balance).toLocaleString()}` },
    { key: 'status', label: 'Status', filterType: 'select',
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      render: (f) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${f.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'}`}>{f.is_active ? 'active' : 'inactive'}</span>
      ) },
  ]

  return (
    <div>
      <PageHeader title="Fund Sources">
        <div className="flex items-center gap-4">
          {getCurrentUser()?.role === 'admin' && (
            <Button variant="outline" onClick={() => setShowExport(true)}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          )}
          <Button onClick={() => {
            setEditing(null)
            setForm({ name: '', code: '', statutory_rule: 'none', current_balance: 0, original_balance: 0, fiscal_year: currentYear, is_active: true, description: '', notes: '' })
            setShowForm(true)
          }}>
            <Plus className="h-4 w-4 mr-1" /> Add Fund Source
          </Button>
        </div>
      </PageHeader>
      
      <DataTable
        columns={columns}
        data={sources}
        loading={loading}
          onRowClick={(s) => { setFlyout(s); loadAuditLogs(s.id) }}
        emptyState={<p className="text-center text-muted-foreground py-6">No fund sources found. Create one to get started.</p>}
        rowKey={(s) => s.id}
        toolbar
        exportable
      />
      <DetailPanel
        open={!!flyout}
        onClose={() => setFlyout(null)}
        title={flyout?.name || ''}
        onEdit={flyout ? () => { openEditPanel(flyout); setFlyout(null) } : undefined}
        onDelete={flyout ? () => { setDeleteId(flyout.id); setFlyout(null) } : undefined}
      >
        {flyout && (() => (
          <>
            <DetailSection icon={<DollarSign className="size-3.5" />} title="Balance Breakdown">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Balance</span>
                  <span className="font-semibold">₱{flyout.original_balance?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span className="font-semibold">₱{flyout.current_balance?.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Deducted</span>
                    <span className="font-semibold text-destructive">-₱{((flyout.original_balance || 0) - (flyout.current_balance || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </DetailSection>
            <DetailSection icon={<Landmark className="size-3.5" />} title="Fund Details">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code</span>
                  <span className="font-mono text-xs">{flyout.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statutory Rule</span>
                  <span>{STATUTORY_LABELS[flyout.statutory_rule]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${flyout.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {flyout.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </DetailSection>
            <DetailSection icon={<Scale className="size-3.5" />} title="Deduction History">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deductions recorded</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {auditLogs.filter((l) => l.details?.toLowerCase().includes('disburs') || l.details?.toLowerCase().includes('restor')).map((l) => (
                    <div key={l.id} className="flex justify-between items-center text-xs border-b pb-1 last:border-0">
                      <div>
                        <span className={`inline-flex items-center rounded px-1 py-0.5 text-xs font-semibold ${l.action === 'create' ? 'bg-green-100 text-green-700' : l.action === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{l.action}</span>
                        <span className="ml-1 text-muted-foreground">{l.details}</span>
                      </div>
                      {l.amount ? <span className="font-semibold">₱{l.amount.toLocaleString()}</span> : null}
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>
            {flyout.description && (
              <DetailSection icon={<FileText className="size-3.5" />} title="Description">
                <p className="text-sm text-muted-foreground">{flyout.description}</p>
              </DetailSection>
            )}
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
        ))()}
      </DetailPanel>
      {showForm && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={() => { setShowForm(false); setEditing(null) }} />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="p-6">
              <h2 className="font-display text-sm font-semibold mb-4">{editing ? 'Edit' : 'Add'} Fund Source</h2>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. GF, 20%_DF" />
                </div>
                <div>
                  <Label>Statutory Rule</Label>
                  <Select value={form.statutory_rule || 'none'} onValueChange={(v: any) => setForm({ ...form, statutory_rule: v })}>
                    <option value="none">None (General Fund)</option>
                    <option value="20%_DF">20% Development Fund</option>
                    <option value="SK">SK Fund</option>
                    <option value="BDRRMF">BDRRM Fund</option>
                    <option value="GAD">Gender & Development</option>
                  </Select>
                </div>
                <div>
                  <Label>Current Balance</Label>
                  <Input type="number" value={form.current_balance || 0} onChange={(e) => setForm({ ...form, current_balance: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Original Balance (set once)</Label>
                  <Input type="number" value={form.original_balance ?? form.current_balance ?? 0} onChange={(e) => setForm({ ...form, original_balance: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Fund Source" message="Are you sure? This cannot be undone." confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        title="Fund Sources"
        columns={[
          { header: 'Name', key: 'name' },
          { header: 'Code', key: 'code' },
          { header: 'Statutory Rule', key: 'statutory_rule' },
          { header: 'Current Balance', key: 'current_balance', format: 'currency' as const },
          { header: 'Status', key: 'status' },
        ]}
        fetchData={async () => {
          const { getFundSources } = await import('@/api/fundSources')
          const data = await getFundSources()
          return data.map((f) => ({
            name: f.name,
            code: f.code,
            statutory_rule: f.statutory_rule || 'none',
            current_balance: f.current_balance,
            status: f.is_active ? 'active' : 'inactive',
          }))
        }}
        filename="fund-sources"
      />
    </div>
  )
}
