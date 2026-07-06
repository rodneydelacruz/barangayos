import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, Pencil, Trash2, ChevronDown, Search, ArrowLeft } from 'lucide-react'
import { getMeetings, getMeeting, createMeeting, updateMeeting, deleteMeeting, type ApiMeeting, type MeetingData, type MeetingWithItems } from '@/api/meetings'
import { createAgendaItem, updateAgendaItem, deleteAgendaItem, type ApiAgendaItem, type AgendaItemData } from '@/api/agenda'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'
import { cn, formatDate } from '@/lib/utils'

const meetingTypeOptions = [
  { value: 'regular', label: 'Regular' },
  { value: 'special', label: 'Special' },
  { value: 'emergency', label: 'Emergency' },
]

const meetingTypeColors: Record<string, string> = {
  regular: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  special: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  emergency: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
}

const statusOptions = ['scheduled', 'ongoing', 'adjourned']

const statusLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  ongoing: 'Ongoing',
  adjourned: 'Adjourned',
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50',
  ongoing: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  adjourned: 'bg-muted text-muted-foreground',
}

const agendaStatusOptions = ['pending', 'discussed', 'deferred']

const agendaStatusLabels: Record<string, string> = {
  pending: 'Pending',
  discussed: 'Discussed',
  deferred: 'Deferred',
}

const agendaStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  discussed: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  deferred: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
}

function minutesStatus(items: ApiAgendaItem[]) {
  const filled = items.filter((i) => i.minutes && i.minutes.trim()).length
  if (items.length === 0) return { label: 'No items', color: 'text-muted-foreground' }
  if (filled === items.length) return { label: 'All filled', color: 'text-emerald-500' }
  return { label: `${filled}/${items.length} filled`, color: 'text-amber-500' }
}

function emptyMeetingForm(): MeetingData {
  return {
    title: '',
    meeting_date: '',
    location: '',
    meeting_type: '',
    status: 'scheduled',
    notes: '',
  }
}

function emptyItemForm(meetingId: string): AgendaItemData {
  return {
    meeting_id: meetingId,
    title: '',
    description: '',
    sort_order: 0,
    status: 'pending',
    minutes: '',
    submitted_by: '',
  }
}

export default function AgendaPage() {
  const [meetings, setMeetings] = useState<ApiMeeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [meetingForm, setMeetingForm] = useState(emptyMeetingForm())
  const [itemForm, setItemForm] = useState<AgendaItemData>(emptyItemForm(''))
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [meetingPanelOpen, setMeetingPanelOpen] = useState(false)
  const [itemPanelOpen, setItemPanelOpen] = useState(false)
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMeetings()
      .then(setMeetings)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load meetings'))
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && meetings.length > 0) {
      const record = meetings.find(m => m.id === selectedId)
      if (record) {
        openMeetingDetail(record.id)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, meetings])

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (search) {
        const q = search.toLowerCase()
        if (!m.title.toLowerCase().includes(q)) return false
      }
      if (statusFilter && m.status !== statusFilter) return false
      return true
    })
  }, [meetings, search, statusFilter])

  function updateMeetingField(field: string, value: string) {
    setMeetingForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateItemField(field: string, value: string | number) {
    setItemForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleMeetingSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!meetingForm.title.trim() || !meetingForm.meeting_date || !meetingForm.meeting_type) return

    try {
      if (editingMeetingId) {
        const updated = await updateMeeting(editingMeetingId, meetingForm)
        setMeetings((prev) => prev.map((m) => (m.id === editingMeetingId ? updated : m)))
        if (selectedMeeting && selectedMeeting.id === editingMeetingId) {
          setSelectedMeeting((prev) => prev ? { ...prev, ...updated } : null)
        }
      } else {
        const created = await createMeeting(meetingForm)
        setMeetings((prev) => [created, ...prev])
      }
      closeMeetingPanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meeting')
    }
  }

  async function handleItemSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemForm.title.trim()) return

    try {
      if (editingItemId) {
        const updated = await updateAgendaItem(editingItemId, itemForm)
        if (selectedMeeting) {
          setSelectedMeeting({
            ...selectedMeeting,
            agendaItems: selectedMeeting.agendaItems.map((i) => (i.id === editingItemId ? updated : i)),
          })
        }
      } else {
        const data = { ...itemForm }

        if (itemForm.minutes && itemForm.minutes.trim()) {
          const { getClient } = await import('@/api/client')
          const authStore = getClient().authStore
          data.submitted_by = (authStore.model as Record<string, unknown>)?.name as string || ''
        }

        const created = await createAgendaItem(data)
        if (selectedMeeting) {
          setSelectedMeeting({
            ...selectedMeeting,
            agendaItems: [...selectedMeeting.agendaItems, created],
          })
        }
      }
      closeItemPanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agenda item')
    }
  }

  async function openMeetingDetail(meetingId: string) {
    setDetailLoading(true)
    setError(null)
    try {
      const meeting = await getMeeting(meetingId)
      setSelectedMeeting(meeting)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meeting details')
    } finally {
      setDetailLoading(false)
    }
  }

  function backToList() {
    setSelectedMeeting(null)
    getMeetings()
      .then(setMeetings)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to refresh meetings'))
  }

  function openCreateMeetingPanel() {
    setError(null)
    setEditingMeetingId(null)
    setMeetingForm(emptyMeetingForm())
    setMeetingPanelOpen(true)
  }

  function openEditMeetingPanel(meeting: ApiMeeting) {
    setEditingMeetingId(meeting.id)
    setMeetingForm({
      title: meeting.title,
      meeting_date: meeting.meeting_date,
      location: meeting.location ?? '',
      meeting_type: meeting.meeting_type,
      status: meeting.status,
      notes: meeting.notes ?? '',
    })
    setMeetingPanelOpen(true)
    setError(null)
  }

  function closeMeetingPanel() {
    setMeetingPanelOpen(false)
    setEditingMeetingId(null)
    setMeetingForm(emptyMeetingForm())
    setError(null)
  }

  function openCreateItemPanel() {
    if (!selectedMeeting) return
    setError(null)
    setEditingItemId(null)
    const nextOrder = selectedMeeting.agendaItems.length > 0
      ? Math.max(...selectedMeeting.agendaItems.map((i) => i.sort_order ?? 0)) + 1
      : 1
    setItemForm({ ...emptyItemForm(selectedMeeting.id), sort_order: nextOrder })
    setItemPanelOpen(true)
  }

  function openEditItemPanel(item: ApiAgendaItem) {
    setEditingItemId(item.id)
    setItemForm({
      meeting_id: item.meeting_id,
      title: item.title,
      description: item.description ?? '',
      sort_order: item.sort_order ?? 0,
      status: item.status,
      minutes: item.minutes ?? '',
      submitted_by: item.submitted_by ?? '',
    })
    setItemPanelOpen(true)
    setError(null)
  }

  function closeItemPanel() {
    setItemPanelOpen(false)
    setEditingItemId(null)
    setItemForm(emptyItemForm(selectedMeeting?.id ?? ''))
    setError(null)
  }

  function handleDeleteMeeting(id: string) {
    setDeletingMeetingId(id)
  }

  async function confirmDeleteMeeting() {
    if (!deletingMeetingId) return
    try {
      await deleteMeeting(deletingMeetingId)
      setMeetings((prev) => prev.filter((m) => m.id !== deletingMeetingId))
      if (selectedMeeting && selectedMeeting.id === deletingMeetingId) {
        setSelectedMeeting(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meeting')
    } finally {
      setDeletingMeetingId(null)
    }
  }

  function handleDeleteItem(id: string) {
    setDeletingItemId(id)
  }

  async function confirmDeleteItem() {
    if (!deletingItemId) return
    try {
      await deleteAgendaItem(deletingItemId)
      if (selectedMeeting) {
        setSelectedMeeting({
          ...selectedMeeting,
          agendaItems: selectedMeeting.agendaItems.filter((i) => i.id !== deletingItemId),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agenda item')
    } finally {
      setDeletingItemId(null)
    }
  }

  function fmtDate(dateStr: string): string {
    return formatDate(dateStr, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isAdmin = hasRole('admin')

  if (selectedMeeting) {
    return (
      <>
        <div className="mb-6 motion-fade-in">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{fmtDate(selectedMeeting.meeting_date)}</span>
            <span className={cn('inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium', meetingTypeColors[selectedMeeting.meeting_type])}>
              {meetingTypeOptions.find((t) => t.value === selectedMeeting.meeting_type)?.label || selectedMeeting.meeting_type}
            </span>
            <span className={cn('inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium', statusColors[selectedMeeting.status])}>
              {statusLabels[selectedMeeting.status]}
            </span>
            {selectedMeeting.location && (
              <span className="text-xs text-muted-foreground/70">{selectedMeeting.location}</span>
            )}
          </div>
          <PageHeader title={selectedMeeting.title}>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={backToList}>
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
            {isAdmin && (
              <>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEditMeetingPanel(selectedMeeting)}>
                  <Pencil className="size-3.5" />
                  Edit Meeting
                </Button>
                <Button size="sm" className="gap-1.5" onClick={openCreateItemPanel}>
                  <Plus className="size-3.5" />
                  Add Item
                </Button>
              </>
            )}
          </div>
        </PageHeader>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {selectedMeeting.notes && (
          <Card className="mb-4">
            <CardContent className="p-4 text-sm text-muted-foreground">{selectedMeeting.notes}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Agenda Items
              {!detailLoading && (
                <span className={cn('text-xs font-normal', minutesStatus(selectedMeeting.agendaItems).color)}>
                  {minutesStatus(selectedMeeting.agendaItems).label}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {detailLoading ? (
              <div className="space-y-2 p-4 sm:p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 rounded border p-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-40 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-14 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : selectedMeeting.agendaItems.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No agenda items yet. Add the first item.</p>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreateItemPanel}>
                    <Plus className="size-3.5" />
                    Add first item
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                      <th className="w-12 px-4 py-3 sm:px-6">#</th>
                      <th className="px-4 py-3 sm:px-6">Title</th>
                      <th className="px-4 py-3 sm:px-6">Status</th>
                      <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Minutes</th>
                      <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMeeting.agendaItems.map((item, i) => (
                      <tr
                        key={item.id}
                        className="border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up"
                        style={{ '--stagger-index': i } as React.CSSProperties}
                      >
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                          {item.sort_order ?? i + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                          <div className="text-sm font-medium text-foreground">{item.title}</div>
                          {item.description && (
                            <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                          <span className={cn('inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium', agendaStatusColors[item.status])}>
                            {agendaStatusLabels[item.status]}
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                          {item.minutes && item.minutes.trim() ? (
                            <span title={item.minutes}>
                              {item.minutes.length > 60 ? item.minutes.slice(0, 60) + '...' : item.minutes}
                              {item.submitted_by && (
                                <span className="ml-1 text-xs text-muted-foreground/60">&mdash; {item.submitted_by}</span>
                              )}
                            </span>
                          ) : selectedMeeting.status === 'scheduled' ? (
                            <span className="italic text-muted-foreground/50">Pending meeting</span>
                          ) : (
                            <span className="italic text-muted-foreground/50">Fill minutes</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right">
                          {isAdmin && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-7 p-0"
                                onClick={() => openEditItemPanel(item)}
                                aria-label="Edit"
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteItem(item.id)}
                                aria-label="Delete"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {itemPanelOpen && (
          <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
            <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closeItemPanel} aria-hidden="true" />
            <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">{editingItemId ? 'Edit Agenda Item' : 'Add Agenda Item'}</h2>
                <button
                  type="button"
                  onClick={closeItemPanel}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Close"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <form onSubmit={handleItemSubmit} className="space-y-5 p-5">
                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="panel-item-title">Title *</Label>
                  <Input
                    id="panel-item-title"
                    value={itemForm.title}
                    onChange={(e) => updateItemField('title', e.target.value)}
                    placeholder="Item title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panel-item-description">Description</Label>
                  <textarea
                    id="panel-item-description"
                    value={itemForm.description}
                    onChange={(e) => updateItemField('description', e.target.value)}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe the agenda item..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-item-sort">Sort Order</Label>
                    <Input
                      id="panel-item-sort"
                      type="number"
                      min={0}
                      value={itemForm.sort_order}
                      onChange={(e) => updateItemField('sort_order', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-item-status">Status</Label>
                    <Select
                      id="panel-item-status"
                      value={itemForm.status}
                      onValueChange={(v) => updateItemField('status', v)}
                    >
                      {agendaStatusOptions.map((s) => (
                        <option key={s} value={s}>{agendaStatusLabels[s]}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                {selectedMeeting?.status !== 'scheduled' && (
                  <div className="space-y-2">
                    <Label htmlFor="panel-item-minutes">Minutes</Label>
                    <textarea
                      id="panel-item-minutes"
                      value={itemForm.minutes}
                      onChange={(e) => updateItemField('minutes', e.target.value)}
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Meeting minutes..."
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="submit">{editingItemId ? 'Update' : 'Add Item'}</Button>
                  <Button type="button" variant="outline" onClick={closeItemPanel}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={deletingItemId !== null}
          title="Delete agenda item"
          message="This action cannot be undone. The agenda item will be permanently removed."
          confirmLabel="Delete"
          destructive
          onConfirm={confirmDeleteItem}
          onCancel={() => setDeletingItemId(null)}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Meetings & Agenda" subtitle="Manage barangay meetings, agenda items, and minutes.">
        {isAdmin && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreateMeetingPanel}>
            <Plus className="size-3.5" />
            New Meeting
          </Button>
        )}
      </PageHeader>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-60 max-w-full pl-8 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v)}
          className="h-9 w-40 text-sm"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Meetings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4 sm:p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded border p-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="h-4 w-48 flex-1 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-14 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No meetings yet. Schedule your first meeting.</p>
              {isAdmin && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreateMeetingPanel}>
                  <Plus className="size-3.5" />
                  Schedule first meeting
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Title</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Date</th>
                    <th className="px-4 py-3 sm:px-6">Type</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6 text-center">Items</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Minutes</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={filteredMeetings.length === 0 ? 'hidden' : ''}>
                  {filteredMeetings.map((m, i) => (
                    <tr
                      key={m.id}
                      className="cursor-pointer border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up hover:bg-muted/40"
                      style={{ '--stagger-index': i } as React.CSSProperties}
                      onClick={() => openMeetingDetail(m.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm font-medium text-foreground">
                        {m.title}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                        {fmtDate(m.meeting_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <span className={cn('inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium', meetingTypeColors[m.meeting_type])}>
                          {meetingTypeOptions.find((t) => t.value === m.meeting_type)?.label || m.meeting_type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <span className={cn('inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium', statusColors[m.status])}>
                          {statusLabels[m.status]}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-center text-sm text-muted-foreground">
                        {m.expand?.agendaItems?.length ?? '\u2014'}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                        {'\u2014'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right">
                        {isAdmin && (
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0"
                              onClick={() => openEditMeetingPanel(m)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteMeeting(m.id)}
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMeetings.length === 0 && meetings.length > 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No meetings match your filters.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {meetingPanelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closeMeetingPanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{editingMeetingId ? 'Edit Meeting' : 'New Meeting'}</h2>
              <button
                type="button"
                onClick={closeMeetingPanel}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
            <form onSubmit={handleMeetingSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="panel-title">Title *</Label>
                <Input
                  id="panel-title"
                  value={meetingForm.title}
                  onChange={(e) => updateMeetingField('title', e.target.value)}
                  placeholder="Meeting title"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-date">Date *</Label>
                  <Input
                    id="panel-date"
                    type="date"
                    value={meetingForm.meeting_date}
                    onChange={(e) => updateMeetingField('meeting_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-location">Location</Label>
                  <Input
                    id="panel-location"
                    value={meetingForm.location ?? ''}
                    onChange={(e) => updateMeetingField('location', e.target.value)}
                    placeholder="Venue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-type">Type *</Label>
                  <Select
                    id="panel-type"
                    value={meetingForm.meeting_type}
                    onValueChange={(v) => updateMeetingField('meeting_type', v)}
                  >
                    <option value="">Select type</option>
                    {meetingTypeOptions.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-status">Status</Label>
                  <Select
                    id="panel-status"
                    value={meetingForm.status}
                    onValueChange={(v) => updateMeetingField('status', v)}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-notes">Notes</Label>
                <textarea
                  id="panel-notes"
                  value={meetingForm.notes ?? ''}
                  onChange={(e) => updateMeetingField('notes', e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Meeting notes..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit">{editingMeetingId ? 'Update' : 'Create Meeting'}</Button>
                <Button type="button" variant="outline" onClick={closeMeetingPanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingMeetingId !== null}
        title="Delete meeting"
        message="This action cannot be undone. The meeting and all its agenda items will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeleteMeeting}
        onCancel={() => setDeletingMeetingId(null)}
      />
    </>
  )
}
