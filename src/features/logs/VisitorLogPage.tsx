import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, Pencil, Trash2, ChevronDown, DoorOpen, Circle, Clock, User, LogOut } from 'lucide-react'
import { getVisitors, createVisitor, updateVisitor, deleteVisitor, checkOutVisitor, type ApiVisitor, type VisitorData } from '@/api/visitors'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hasRole } from '@/auth/session'
import { cn, formatDateTime } from '@/lib/utils'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { SortSelect } from '@/components/ui/SortSelect'
import Pagination from '@/components/ui/Pagination'

function emptyForm(): VisitorData {
  return {
    visitor_name: '',
    contact_number: '',
    purpose: '',
    person_to_visit: '',
  }
}

function formatTime(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VisitorLogPage() {
  const [visitors, setVisitors] = useState<ApiVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [form, setForm] = useState<VisitorData>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flyoutVisitor, setFlyoutVisitor] = useState<ApiVisitor | null>(null)
  const [sortBy, setSortBy] = useState('-time_in')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  useEffect(() => {
    getVisitors()
      .then(setVisitors)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load visitors'))
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && visitors.length > 0) {
      const record = visitors.find(v => v.id === selectedId)
      if (record) {
        setFlyoutVisitor(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, visitors])

  const filteredVisitors = useMemo(() => {
    const sorted = [...visitors].sort((a, b) => {
      const desc = sortBy.startsWith('-')
      const field = desc ? sortBy.slice(1) : sortBy
      const va: string = (a as Record<string, unknown>)[field] as string || ''
      const vb: string = (b as Record<string, unknown>)[field] as string || ''
      const cmp = va.localeCompare(vb)
      return desc ? -cmp : cmp
    })
    return sorted.filter((v) => {
      if (search) {
        const q = search.toLowerCase()
        if (!v.visitor_name.toLowerCase().includes(q) && !v.purpose.toLowerCase().includes(q)) return false
      }
      if (activeOnly && v.time_out) return false
      return true
    })
  }, [visitors, search, activeOnly, sortBy])

  const totalPages = Math.ceil(filteredVisitors.length / PAGE_SIZE)
  const paginatedVisitors = filteredVisitors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, activeOnly, sortBy])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.visitor_name.trim() || !form.purpose.trim()) return

    try {
      if (editingId) {
        const updated = await updateVisitor(editingId, form)
        setVisitors((prev) => prev.map((v) => (v.id === editingId ? updated : v)))
      } else {
        const created = await createVisitor(form)
        setVisitors((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save visitor')
    }
  }

  async function handleCheckOut(id: string) {
    try {
      const updated = await checkOutVisitor(id)
      setVisitors((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out visitor')
    }
  }

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiVisitor) {
    setEditingId(record.id)
    setForm({
      visitor_name: record.visitor_name,
      contact_number: record.contact_number,
      purpose: record.purpose,
      person_to_visit: record.person_to_visit,
    })
    setPanelOpen(true)
    setError(null)
  }

  function handleDelete(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteVisitor(deletingId)
      setVisitors((prev) => prev.filter((v) => v.id !== deletingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete visitor')
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
    { value: 'visitor_name', label: 'Name' },
    { value: 'purpose', label: 'Purpose' },
    { value: 'person_to_visit', label: 'Visiting' },
    { value: 'time_in', label: 'Time In' },
    { value: '-time_in', label: 'Newest' },
  ]

  function closeFlyout() {
    setFlyoutVisitor(null)
  }

  return (
    <>
      <PageHeader title="Visitor Logs" subtitle="Track and manage visitor entries.">
        {canModify && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            Log Visitor
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or purpose..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-60 max-w-full text-sm"
        />
        <button
          type="button"
          onClick={() => setActiveOnly((prev) => !prev)}
          className={cn(
            'h-9 rounded-md border px-3 text-sm font-medium transition-colors',
            activeOnly
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <span className="flex items-center gap-1.5">
            <Circle className={cn('size-2.5 fill-current', activeOnly ? 'text-emerald-500' : 'text-muted-foreground/40')} />
            Show active only
          </span>
          </button>
          <SortSelect options={sortFields} value={sortBy} onChange={setSortBy} />
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitor Entries</CardTitle>
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
          ) : visitors.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No visitors logged yet.</p>
              {canModify && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreatePanel}>
                  <Plus className="size-3.5" />
                  Log your first visitor
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Visitor Name</th>
                    <th className="px-4 py-3 sm:px-6">Purpose</th>
                    <th className="px-4 py-3 sm:px-6">Time In</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className={paginatedVisitors.length === 0 ? 'hidden' : ''}>
                  {paginatedVisitors.map((v, i) => (
                    <tr
                      key={v.id}
                      className="cursor-pointer border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up hover:bg-muted/30 transition-colors"
                      style={{ '--stagger-index': i } as React.CSSProperties}
                      onClick={() => setFlyoutVisitor(v)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm font-medium text-foreground">
                        {v.visitor_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {v.purpose}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">
                        {formatTime(v.time_in)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        {v.time_out ? (
                          <span className="text-sm text-muted-foreground">{formatTime(v.time_out)}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <Circle className="size-2 fill-current" />
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVisitors.length === 0 && visitors.length > 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No visitors match your filters.</p>
                </div>
              )}
              <Pagination page={page} totalPages={totalPages} totalItems={filteredVisitors.length} onPageChange={setPage} pageSize={PAGE_SIZE} />
            </div>
          )}
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Visitor' : 'Log Visitor'}</h2>
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

              <div className="space-y-2">
                <Label htmlFor="panel-visitor-name">Visitor Name *</Label>
                <Input id="panel-visitor-name" value={form.visitor_name} onChange={(e) => updateField('visitor_name', e.target.value)} required autoFocus />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-contact">Contact Number</Label>
                <Input id="panel-contact" value={form.contact_number || ''} onChange={(e) => updateField('contact_number', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-purpose">Purpose *</Label>
                <Input id="panel-purpose" value={form.purpose} onChange={(e) => updateField('purpose', e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-person-to-visit">Person to Visit</Label>
                <Input id="panel-person-to-visit" value={form.person_to_visit || ''} onChange={(e) => updateField('person_to_visit', e.target.value)} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailPanel
        open={flyoutVisitor !== null}
        onClose={closeFlyout}
        title={flyoutVisitor?.visitor_name ?? ''}
        onEdit={canModify && flyoutVisitor ? () => { openEditPanel(flyoutVisitor); closeFlyout() } : undefined}
        onDelete={canModify && flyoutVisitor ? () => handleDelete(flyoutVisitor.id) : undefined}
      >
        {flyoutVisitor && (
          <>
            {canModify && !flyoutVisitor.time_out && (
              <DetailSection icon={<LogOut className="size-3" />} title="Quick Actions">
                <Button size="sm" className="gap-1.5" onClick={() => { handleCheckOut(flyoutVisitor.id); closeFlyout() }}>
                  <DoorOpen className="size-3.5" />
                  Check Out
                </Button>
              </DetailSection>
            )}

            <DetailSection icon={<User className="size-3" />} title="Visitor Info">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{flyoutVisitor.visitor_name}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Contact:</span> {flyoutVisitor.contact_number || '—'}</div>
              </div>
            </DetailSection>

            <DetailSection title="Visit Details">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2"><span className="text-muted-foreground">Purpose:</span> {flyoutVisitor.purpose}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Person to Visit:</span> {flyoutVisitor.person_to_visit || '—'}</div>
              </div>
            </DetailSection>

            <DetailSection icon={<Clock className="size-3" />} title="Timeline">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Time In:</span> {formatTime(flyoutVisitor.time_in)}</div>
                <div><span className="text-muted-foreground">Time Out:</span> {flyoutVisitor.time_out ? formatTime(flyoutVisitor.time_out) : <span className={cn('inline-flex items-center gap-1 rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300')}><Circle className="size-2 fill-current" />Active</span>}</div>
              </div>
            </DetailSection>

            <DetailSection title="Metadata">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Created: {formatDateTime(flyoutVisitor.created)}</div>
                <div>Updated: {formatDateTime(flyoutVisitor.updated)}</div>
              </div>
            </DetailSection>
          </>
        )}
      </DetailPanel>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete visitor entry"
        message="This action cannot be undone. The visitor log entry will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
