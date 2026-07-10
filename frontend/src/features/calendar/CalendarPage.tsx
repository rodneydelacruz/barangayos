import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { getEventsByMonth, createEvent, updateEvent, deleteEvent, type ApiCalendarEvent, type CalendarEventData } from '@/api/calendar'
import { getMeetings, type ApiMeeting } from '@/api/meetings'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'
import { cn } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const eventTypeColors: Record<string, string> = {
  barangay_event: 'bg-blue-500',
  hearing: 'bg-amber-500',
  council_meeting: 'bg-emerald-500',
  holiday: 'bg-red-500',
  other: 'bg-slate-500',
}

const eventTypeLabels: Record<string, string> = {
  barangay_event: 'Barangay Event',
  hearing: 'Hearing',
  council_meeting: 'Council Meeting',
  holiday: 'Holiday',
  other: 'Other',
}

const eventTypeOptions = [
  { value: 'barangay_event', label: 'Barangay Event' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'council_meeting', label: 'Council Meeting' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'other', label: 'Other' },
]

function emptyForm(): CalendarEventData {
  return {
    title: '',
    description: '',
    event_type: '',
    start_datetime: '',
    end_datetime: '',
    all_day: false,
    location: '',
    agenda_ref: '',
    notes: '',
  }
}

function toDateInput(dt: string): string {
  if (!dt) return ''
  return dt.slice(0, 16)
}

function toISO(input: string): string | undefined {
  if (!input) return undefined
  return input.length === 16 ? `${input}:00` : input
}

function formatTime(dt: string): string {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(dt: string): string {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CalendarPage() {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [events, setEvents] = useState<ApiCalendarEvent[]>([])
  const [meetings, setMeetings] = useState<ApiMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  useBodyScrollLock(panelOpen)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CalendarEventData>(emptyForm())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getEventsByMonth(year, month),
      getMeetings(),
    ])
      .then(([eventsData, meetingsData]) => {
        setEvents(eventsData)
        setMeetings(meetingsData.filter((m: ApiMeeting) => m.status === 'scheduled' || m.status === 'ongoing'))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [year, month])

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const eventsByDate = useMemo(() => {
    const map: Record<string, ApiCalendarEvent[]> = {}
    for (const e of events) {
      const dateKey = e.start_datetime.slice(0, 10)
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(e)
    }
    return map
  }, [events])

  const selectedEvents = eventsByDate[selectedDate] ?? []

  const dayEvents = useMemo(() => {
    const result: { date: string; count: number; events: ApiCalendarEvent[] }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayEvts = eventsByDate[dateStr] ?? []
      result.push({ date: dateStr, count: dayEvts.length, events: dayEvts })
    }
    return result
  }, [year, month, daysInMonth, eventsByDate])

  function navigateMonth(delta: number) {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  function selectDate(dateStr: string) {
    setSelectedDate(dateStr)
  }

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setPanelOpen(true)
  }

  function openEditPanel(event: ApiCalendarEvent) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description ?? '',
      event_type: event.event_type,
      start_datetime: toDateInput(event.start_datetime),
      end_datetime: toDateInput(event.end_datetime ?? ''),
      all_day: event.all_day ?? false,
      location: event.location ?? '',
      agenda_ref: event.agenda_ref ?? '',
      notes: event.notes ?? '',
    })
    setPanelOpen(true)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.event_type || !form.start_datetime) return

    const payload = {
      title: form.title,
      description: form.description || undefined,
      event_type: form.event_type,
      start_datetime: toISO(form.start_datetime)!,
      end_datetime: form.end_datetime ? toISO(form.end_datetime) : undefined,
      all_day: form.all_day,
      location: form.location || undefined,
      agenda_ref: form.agenda_ref || undefined,
      notes: form.notes || undefined,
    }

    try {
      if (editingId) {
        const updated = await updateEvent(editingId, payload)
        setEvents((prev) => prev.map((ev) => (ev.id === editingId ? updated : ev)))
      } else {
        const created = await createEvent(payload)
        setEvents((prev) => [...prev, created])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteEvent(deletingId)
      setEvents((prev) => prev.filter((ev) => ev.id !== deletingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
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

  const canManage = hasRole('admin') || hasRole('staff')

  return (
    <>
      <PageHeader title="Calendar">
        {canManage && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            Add Event
          </Button>
        )}
      </PageHeader>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="flex gap-2">
              <div className="size-8 animate-pulse rounded-md bg-muted" />
              <div className="size-8 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-border">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-card p-1">
                <div className="h-4 w-4 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1 rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-display text-sm font-semibold text-foreground">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="border-b border-r bg-muted/30 px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square border-b border-r bg-muted/10 last:border-r-0" />
              ))}
              {dayEvents.map(({ date: dateStr, count: evCount, events: dayEvts }) => {
                const dayNum = parseInt(dateStr.slice(8), 10)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                const visibleDots = dayEvts.slice(0, 3)
                const extraCount = dayEvts.length - 3

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => selectDate(dateStr)}
                    className={cn(
                      'relative flex aspect-square flex-col items-center justify-start gap-0.5 border-b border-r p-1 text-left last:border-r-0 hover:bg-accent/30 transition-colors',
                      isSelected && 'bg-gold/20 ring-1 ring-inset ring-gold',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                        isToday && 'font-semibold text-gold',
                        isSelected && 'font-semibold text-gold',
                      )}
                    >
                      {dayNum}
                    </span>
                    {evCount > 0 && (
                      <div className="flex flex-wrap gap-0.5 px-0.5">
                        {visibleDots.map((ev) => (
                          <span
                            key={ev.id}
                            className={cn(
                              'inline-block size-1 rounded-full',
                              eventTypeColors[ev.event_type] || 'bg-slate-500',
                            )}
                          />
                        ))}
                        {extraCount > 0 && (
                          <span className="text-[10px] leading-none text-muted-foreground">+{extraCount}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="w-full rounded-lg border bg-card lg:w-80">
            <div className="border-b px-4 py-3">
              <h3 className="font-display text-sm font-semibold text-foreground">
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Select a day'}
              </h3>
            </div>
            <div className="divide-y p-2">
              {selectedEvents.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">No events on this day.</p>
              ) : (
                selectedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="group relative rounded-md px-2 py-2.5 hover:bg-accent/50 cursor-pointer"
                    onClick={() => openEditPanel(ev)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('inline-block size-2 shrink-0 rounded-full', eventTypeColors[ev.event_type] || 'bg-slate-500')} />
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            {eventTypeLabels[ev.event_type] || ev.event_type}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{ev.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(ev.start_datetime)}
                          {ev.start_datetime.includes('T') && ` at ${formatTime(ev.start_datetime)}`}
                          {ev.end_datetime && ` - ${formatTime(ev.end_datetime)}`}
                        </p>
                        {ev.location && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{ev.location}</p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEditPanel(ev) }}
                            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                            aria-label="Edit"
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(ev.id) }}
                            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:w-1/2 md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl font-display">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">{editingId ? 'Edit Event' : 'Add Event'}</h2>
              <button
                type="button"
                onClick={closePanel}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <ChevronRight className="size-4 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="panel-title">Title *</Label>
                <Input
                  id="panel-title"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-description">Description</Label>
                <textarea
                  id="panel-description"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the event..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-event-type">Event Type *</Label>
                <Select
                  id="panel-event-type"
                  value={form.event_type}
                  onValueChange={(v) => updateField('event_type', v)}
                >
                  <option value="">Select type</option>
                  {eventTypeOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-start">Start *</Label>
                <Input
                  id="panel-start"
                  type="datetime-local"
                  value={form.start_datetime}
                  onChange={(e) => updateField('start_datetime', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-end">End</Label>
                <Input
                  id="panel-end"
                  type="datetime-local"
                  value={form.end_datetime}
                  onChange={(e) => updateField('end_datetime', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="panel-all-day"
                  type="checkbox"
                  checked={form.all_day ?? false}
                  onChange={(e) => updateField('all_day', e.target.checked)}
                  className="size-4 rounded border-input text-gold focus:ring-gold"
                />
                <Label htmlFor="panel-all-day" className="text-sm font-normal">All-day event</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-location">Location</Label>
                <Input
                  id="panel-location"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Barangay Hall"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-agenda-ref">Link to Meeting</Label>
                <Select
                  id="panel-agenda-ref"
                  value={form.agenda_ref}
                  onValueChange={(v) => updateField('agenda_ref', v)}
                >
                  <option value="">No meeting</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({formatDate(m.meeting_date)})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-notes">Notes</Label>
                <textarea
                  id="panel-notes"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit">{editingId ? 'Update' : 'Add Event'}</Button>
                <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete event"
        message="This action cannot be undone. The event will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
