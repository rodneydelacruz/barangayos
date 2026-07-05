import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { getBlotters, createBlotter, updateBlotter, deleteBlotter, getNextCaseNumber, type ApiBlotter, type BlotterData } from '@/api/blotter'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
  hearing:   { label: 'Hearing',   color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
  settled:   { label: 'Settled',   color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  escalated: { label: 'Escalated', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  dismissed: { label: 'Dismissed', color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-500/10' },
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBlotters()
      .then(setBlotters)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load blotters'))
      .finally(() => setLoading(false))
  }, [])

  const filteredBlotters = useMemo(() => {
    return blotters.filter((b) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !b.case_number.toLowerCase().includes(q) &&
          !b.complainant_name.toLowerCase().includes(q) &&
          !b.respondent_name?.toLowerCase().includes(q)
        ) return false
      }
      if (statusFilter && b.status !== statusFilter) return false
      if (typeFilter && b.incident_type !== typeFilter) return false
      return true
    })
  }, [blotters, search, statusFilter, typeFilter])

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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by case # or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-60 max-w-full text-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v)}
          className="h-9 w-36 text-sm"
        >
          <option value="">All Status</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v)}
          className="h-9 w-36 text-sm"
        >
          <option value="">All Types</option>
          {incidentTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blotter Cases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4 sm:p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded border p-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : blotters.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No blotter cases yet.</p>
              {canModify && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreatePanel}>
                  <Plus className="size-3.5" />
                  Create first case
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Case #</th>
                    <th className="px-4 py-3 sm:px-6">Complainant</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Respondent</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Incident Type</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Date</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={filteredBlotters.length === 0 ? 'hidden' : ''}>
                  {filteredBlotters.map((b, i) => {
                    const cfg = statusConfig[b.status]
                    return (
                      <tr
                        key={b.id}
                        className="border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up"
                        style={{ '--stagger-index': i } as React.CSSProperties}
                      >
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm font-medium text-foreground">
                          {b.case_number}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                          {b.complainant_name}
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                          {b.respondent_name || '—'}
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground capitalize">
                          {b.incident_type}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                          {b.incident_date ? new Date(b.incident_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right">
                          {canModify && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-8 p-0"
                                onClick={() => openEditPanel(b)}
                                aria-label="Edit"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(b.id)}
                                aria-label="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredBlotters.length === 0 && blotters.length > 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No blotter cases match your filters.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Blotter Case' : 'New Blotter Case'}</h2>
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
                    <Input id="panel-complainant-name" value={form.complainant_name} onChange={(e) => updateField('complainant_name', e.target.value)} required autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-complainant-contact">Contact</Label>
                    <Input id="panel-complainant-contact" value={form.complainant_contact} onChange={(e) => updateField('complainant_contact', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-respondent-name">Respondent Name</Label>
                    <Input id="panel-respondent-name" value={form.respondent_name} onChange={(e) => updateField('respondent_name', e.target.value)} />
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
