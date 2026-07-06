import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, Calendar, Users, BookOpen, FileText } from 'lucide-react'
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
import { SortSelect } from '@/components/ui/SortSelect'
import Pagination from '@/components/ui/Pagination'
import { hasRole } from '@/auth/session'
import { cn, formatDate, formatDateTime } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-800', bg: 'bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300' },
  hearing:   { label: 'Hearing',   color: 'text-blue-800',  bg: 'bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300' },
  settled:   { label: 'Settled',   color: 'text-emerald-800', bg: 'bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' },
  escalated: { label: 'Escalated', color: 'text-orange-800', bg: 'bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300' },
  dismissed: { label: 'Dismissed', color: 'text-red-800',    bg: 'bg-red-200 dark:bg-red-900/30 dark:text-red-300' },
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
  const [flyoutBlotter, setFlyoutBlotter] = useState<ApiBlotter | null>(null)
  const [sortBy, setSortBy] = useState('-created')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  useEffect(() => {
    getBlotters()
      .then(setBlotters)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load blotters'))
      .finally(() => setLoading(false))
  }, [])

  const filteredBlotters = useMemo(() => {
    const sorted = [...blotters].sort((a, b) => {
      const desc = sortBy.startsWith('-')
      const field = desc ? sortBy.slice(1) : sortBy
      const va: string = (a as Record<string, unknown>)[field] as string || ''
      const vb: string = (b as Record<string, unknown>)[field] as string || ''
      const cmp = va.localeCompare(vb)
      return desc ? -cmp : cmp
    })
    return sorted.filter((b) => {
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
  }, [blotters, search, statusFilter, typeFilter, sortBy])

  const totalPages = Math.ceil(filteredBlotters.length / PAGE_SIZE)
  const paginatedBlotters = filteredBlotters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, statusFilter, typeFilter, sortBy])

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

  const sortFields = [
    { value: 'case_number', label: 'Case #' },
    { value: 'incident_type', label: 'Type' },
    { value: 'status', label: 'Status' },
    { value: 'incident_date', label: 'Date' },
    { value: '-created', label: 'Newest' },
  ]

  function closeFlyout() {
    setFlyoutBlotter(null)
  }

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
          <SortSelect options={sortFields} value={sortBy} onChange={setSortBy} />
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
                  </tr>
                </thead>
                <tbody className={paginatedBlotters.length === 0 ? 'hidden' : ''}>
                  {paginatedBlotters.map((b, i) => {
                    const cfg = statusConfig[b.status]
                    return (
                      <tr
                        key={b.id}
                        className="cursor-pointer border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up hover:bg-muted/30"
                        style={{ '--stagger-index': i } as React.CSSProperties}
                        onClick={() => setFlyoutBlotter(b)}
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
                          {formatDate(b.incident_date)}
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
              <Pagination page={page} totalPages={totalPages} totalItems={filteredBlotters.length} onPageChange={setPage} pageSize={PAGE_SIZE} />
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
                  <div><span className="text-muted-foreground">Status:</span> <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>{cfg.label}</span></div>
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
