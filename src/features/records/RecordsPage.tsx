import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronDown, Calendar, Users, BookOpen, FileText } from 'lucide-react'
import { getBlotters, createBlotter, updateBlotter, deleteBlotter, getNextCaseNumber, type ApiBlotter, type BlotterData } from '@/api/blotter'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ResidentCombobox } from '@/components/ui/ResidentCombobox'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { blotterStatusColors } from '@/lib/statusStyles'
import { hasRole } from '@/auth/session'
import { cn, formatDate, formatDateTime } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-900', bg: 'bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300' },
  hearing:   { label: 'Hearing',   color: 'text-blue-900',  bg: 'bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300' },
  settled:   { label: 'Settled',   color: 'text-emerald-900', bg: 'bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' },
  escalated: { label: 'Escalated', color: 'text-orange-900', bg: 'bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300' },
  dismissed: { label: 'Dismissed', color: 'text-red-900',    bg: 'bg-red-200 dark:bg-red-900/30 dark:text-red-300' },
}

const incidentTypeOptions = [
  { value: 'blotter', label: 'Blotter' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'settled', label: 'Settled' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'dismissed', label: 'Dismissed' },
]

function emptyForm(): BlotterData & { case_number: string } {
  return {
    case_number: '',
    incident_type: 'blotter',
    complainant_name: '',
    complainant_contact: '',
    respondent_name: '',
    respondent_contact: '',
    incident_date: '',
    incident_location: '',
    narrative: '',
    involved_parties: '',
    status: 'pending',
    action_taken: '',
  }
}

export default function RecordsPage() {
  const [blotters, setBlotters] = useState<ApiBlotter[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flyoutBlotter, setFlyoutBlotter] = useState<ApiBlotter | null>(null)
  

  useEffect(() => {
    getBlotters()
      .then(setBlotters)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load blotters'))
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && blotters.length > 0) {
      const record = blotters.find(b => b.id === selectedId)
      if (record) {
        setFlyoutBlotter(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, blotters])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.complainant_name.trim()) return

    try {
      if (editingId) {
        const { case_number, ...payload } = form
        const updated = await updateBlotter(editingId, payload)
        setBlotters((prev) =>
          prev.map((b) => (b.id === editingId ? updated : b)),
        )
      } else {
        const caseNumber = form.case_number || await getNextCaseNumber()
        const { case_number: _, ...payload } = form
        const created = await createBlotter({ ...payload, case_number: caseNumber })
        setBlotters((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save blotter case')
    }
  }

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    const base = emptyForm()
    getNextCaseNumber().then((num) => {
      setForm({ ...base, case_number: num })
    }).catch(() => {
      setForm(base)
    })
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiBlotter) {
    setEditingId(record.id)
    setForm({
      case_number: record.case_number,
      incident_type: record.incident_type,
      complainant_name: record.complainant_name,
      complainant_contact: record.complainant_contact,
      respondent_name: record.respondent_name,
      respondent_contact: record.respondent_contact,
      incident_date: record.incident_date,
      incident_location: record.incident_location,
      narrative: record.narrative,
      involved_parties: record.involved_parties,
      status: record.status,
      action_taken: record.action_taken,
    })
    setPanelOpen(true)
    setError(null)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteBlotter(deletingId)
      setBlotters((prev) => prev.filter((b) => b.id !== deletingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blotter case')
    } finally {
      setDeletingId(null)
    }
  }

  function closePanel() {
    setPanelOpen(false)
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
  }

  const canModify = hasRole('admin', 'staff')

  function closeFlyout() {
    setFlyoutBlotter(null)
  }

  const blotterColumns: Column<ApiBlotter>[] = [
    { key: 'case_number', label: 'Case #', sortable: true, filterType: 'text' },
    { key: 'complainant_name', label: 'Complainant', sortable: true, filterType: 'text' },
    { key: 'respondent_name', label: 'Respondent', sortable: true, hideBelow: 'sm', filterType: 'text' },
    { key: 'incident_type', label: 'Incident Type', hideBelow: 'sm', filterType: 'select',
      filterOptions: [
        { label: 'Blotter', value: 'blotter' }, { label: 'Complaint', value: 'complaint' },
        { label: 'Dispute', value: 'dispute' }, { label: 'Other', value: 'other' },
      ] },
    { key: 'status', label: 'Status',
      render: (b) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${blotterStatusColors[b.status] ?? ''}`}>
          {b.status}
        </span>
      ),
      filterType: 'select',
      filterOptions: [
        { label: 'Pending', value: 'pending' }, { label: 'Hearing', value: 'hearing' },
        { label: 'Settled', value: 'settled' }, { label: 'Escalated', value: 'escalated' },
        { label: 'Dismissed', value: 'dismissed' },
      ] },
    { key: 'created', label: 'Date', filterType: 'date', render: (b) => b.created ? new Date(b.created).toLocaleDateString() : '', hideBelow: 'md' },
  ]

  return (
    <>
      <PageHeader title="Blotter Records" subtitle="Manage and track incident reports and complaints.">
        {canModify && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            New Blotter
          </Button>
        )}
      </PageHeader>

      <Card lifted={false} className="shadow-none">
        
        <CardContent className="p-0">
          <DataTable
            columns={blotterColumns}
            data={blotters}
            loading={loading}
            onRowClick={(b) => setFlyoutBlotter(b)}
            emptyState={
              <EmptyState
                title="No blotter cases yet."
                action={canModify && blotters.length === 0 ? { label: "Create first case", onClick: openCreatePanel } : undefined}
              />
            }
            toolbar
            exportable
            rowKey={(b) => b.id}
          />
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">{editingId ? 'Edit Blotter Case' : 'New Blotter Case'}</h2>
              <button
                type="button"
                onClick={closePanel}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Case Info</legend>
                <div className="space-y-2">
                  <Label htmlFor="panel-case-number">Case Number</Label>
                  <Input id="panel-case-number" value={form.case_number} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-incident-type">Incident Type</Label>
                  <Select
                    id="panel-incident-type"
                    value={form.incident_type}
                    onValueChange={(v) => updateField('incident_type', v)}
                  >
                    {incidentTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-incident-date">Incident Date</Label>
                    <Input id="panel-incident-date" type="date" value={form.incident_date} onChange={(e) => updateField('incident_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-incident-location">Location</Label>
                    <Input id="panel-incident-location" value={form.incident_location} onChange={(e) => updateField('incident_location', e.target.value)} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parties</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-complainant-name">Complainant Name *</Label>
                    <ResidentCombobox value={form.complainant_name} onChange={(v) => updateField('complainant_name', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-complainant-contact">Contact</Label>
                    <Input id="panel-complainant-contact" value={form.complainant_contact} onChange={(e) => updateField('complainant_contact', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-respondent-name">Respondent Name</Label>
                    <ResidentCombobox value={form.respondent_name ?? ''} onChange={(v) => updateField('respondent_name', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-respondent-contact">Contact</Label>
                    <Input id="panel-respondent-contact" value={form.respondent_contact} onChange={(e) => updateField('respondent_contact', e.target.value)} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</legend>
                <div className="space-y-2">
                  <Label htmlFor="panel-narrative">Narrative</Label>
                  <textarea
                    id="panel-narrative"
                    value={form.narrative}
                    onChange={(e) => updateField('narrative', e.target.value)}
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-involved-parties">Involved Parties</Label>
                  <textarea
                    id="panel-involved-parties"
                    value={form.involved_parties}
                    onChange={(e) => updateField('involved_parties', e.target.value)}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolution</legend>
                <div className="space-y-2">
                  <Label htmlFor="panel-status">Status</Label>
                  <Select
                    id="panel-status"
                    value={form.status}
                    onValueChange={(v) => updateField('status', v)}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                {(form.status === 'settled' || form.status === 'escalated') && (
                  <div className="space-y-2">
                    <Label htmlFor="panel-action-taken">Action Taken</Label>
                    <textarea
                      id="panel-action-taken"
                      value={form.action_taken}
                      onChange={(e) => updateField('action_taken', e.target.value)}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}
              </fieldset>

              <div className="flex gap-2 pt-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailPanel
        open={flyoutBlotter !== null}
        onClose={closeFlyout}
        title={flyoutBlotter ? `Case #${flyoutBlotter.case_number}` : ''}
        onEdit={canModify && flyoutBlotter ? () => { openEditPanel(flyoutBlotter); closeFlyout() } : undefined}
        onDelete={canModify && flyoutBlotter ? () => handleDelete(flyoutBlotter.id) : undefined}
      >
        {flyoutBlotter && (() => {
          const cfg = statusConfig[flyoutBlotter.status]
          return (
            <>
              <DetailSection icon={<Calendar className="size-3" />} title="Case Info">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Case #:</span> <span className="font-medium">{flyoutBlotter.case_number}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{flyoutBlotter.incident_type}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className={cn('inline-flex items-center gap-1.5 rounded-md px-3.5 py-0.5 text-xs font-bold', cfg.bg, cfg.color)}>{cfg.label}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> {formatDate(flyoutBlotter.incident_date)}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Location:</span> {flyoutBlotter.incident_location || '—'}</div>
                </div>
              </DetailSection>

              <DetailSection icon={<Users className="size-3" />} title="Parties">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Complainant:</span> {flyoutBlotter.complainant_name}</div>
                  <div><span className="text-muted-foreground">Complainant Contact:</span> {flyoutBlotter.complainant_contact || '—'}</div>
                  <div><span className="text-muted-foreground">Respondent:</span> {flyoutBlotter.respondent_name || '—'}</div>
                  <div><span className="text-muted-foreground">Respondent Contact:</span> {flyoutBlotter.respondent_contact || '—'}</div>
                </div>
              </DetailSection>

              {flyoutBlotter.narrative && (
                <DetailSection icon={<BookOpen className="size-3" />} title="Narrative">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyoutBlotter.narrative}</p>
                </DetailSection>
              )}

              {flyoutBlotter.involved_parties && (
                <DetailSection title="Involved Parties">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyoutBlotter.involved_parties}</p>
                </DetailSection>
              )}

              {flyoutBlotter.action_taken && (
                <DetailSection icon={<FileText className="size-3" />} title="Action Taken">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyoutBlotter.action_taken}</p>
                </DetailSection>
              )}

              <DetailSection title="Metadata">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Created: {formatDateTime(flyoutBlotter.created)}</div>
                  <div>Updated: {formatDateTime(flyoutBlotter.updated)}</div>
                </div>
              </DetailSection>
            </>
          )
        })()}
      </DetailPanel>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete blotter case"
        message="This action cannot be undone. The blotter case and all its data will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
