import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronDown, DoorOpen, Circle, Clock, User, LogOut } from 'lucide-react'
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
import { DataTable, type Column } from '@/components/ui/data-table'

type VisitorRow = ApiVisitor & {
  status: 'checked_in' | 'checked_out'
}

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

const statusOptions = [
  { label: 'Checked In', value: 'checked_in' },
  { label: 'Checked Out', value: 'checked_out' },
]

const statusColors: Record<VisitorRow['status'], string> = {
  checked_in: 'bg-emerald-200 px-3 py-0.5 text-emerald-900 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  checked_out: 'bg-muted px-3 py-0.5 text-muted-foreground border border-border/60',
}

const columns: Column<VisitorRow>[] = [
  { key: 'visitor_name', label: 'Visitor Name', sortable: true, filterType: 'text' },
  { key: 'purpose', label: 'Purpose', sortable: true, filterType: 'text' },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterType: 'select',
    filterOptions: statusOptions,
    render: (visitor) => (
      visitor.status === 'checked_in' ? (
        <span className={cn('inline-flex items-center gap-1 rounded-md text-xs font-bold', statusColors.checked_in)}>
          <Circle className="size-2 fill-current" />
          Active
        </span>
      ) : (
        <span className={cn('inline-flex items-center rounded-md text-xs font-bold', statusColors.checked_out)}>
          Checked Out
        </span>
      )
    ),
  },
  {
    key: 'time_in',
    label: 'Time In',
    sortable: true,
    render: (visitor) => (visitor.time_in ? formatTime(visitor.time_in) : ''),
  },
  {
    key: 'time_out',
    label: 'Time Out',
    hideBelow: 'sm',
    render: (visitor) => (visitor.time_out ? formatTime(visitor.time_out) : '-'),
  },
]

export default function VisitorLogPage() {
  const [visitors, setVisitors] = useState<ApiVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<VisitorData>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flyoutVisitor, setFlyoutVisitor] = useState<ApiVisitor | null>(null)

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
      const record = visitors.find((visitor) => visitor.id === selectedId)
      if (record) {
        setFlyoutVisitor(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, visitors])

  const tableVisitors = useMemo<VisitorRow[]>(
    () => visitors.map((visitor) => ({
      ...visitor,
      status: visitor.time_out ? 'checked_out' : 'checked_in',
    })),
    [visitors],
  )

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.visitor_name.trim() || !form.purpose.trim()) return

    try {
      if (editingId) {
        const updated = await updateVisitor(editingId, form)
        setVisitors((prev) => prev.map((visitor) => (visitor.id === editingId ? updated : visitor)))
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
      setVisitors((prev) => prev.map((visitor) => (visitor.id === id ? updated : visitor)))
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
      setVisitors((prev) => prev.filter((visitor) => visitor.id !== deletingId))
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

      <Card lifted={false} className="shadow-none">
        
        <CardContent className="p-0">
          {loading ? (
            <DataTable columns={columns} data={[]} loading rowKey={(visitor) => visitor.id} />
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
            <DataTable
              columns={columns}
              data={tableVisitors}
              loading={loading}
              onRowClick={(visitor) => setFlyoutVisitor(visitor)}
              emptyState={
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No visitors match your filters.</p>
                </div>
              }
              rowKey={(visitor) => visitor.id}
            />
          )}
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full overflow-y-auto bg-card shadow-xl motion-slide-up motion-fade-in md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
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
                <div className="col-span-2">
                  <span className="text-muted-foreground">Name:</span> <span className="font-medium">{flyoutVisitor.visitor_name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Contact:</span> {flyoutVisitor.contact_number || '-'}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Visit Details">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <span className="text-muted-foreground">Purpose:</span> {flyoutVisitor.purpose}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Person to Visit:</span> {flyoutVisitor.person_to_visit || '-'}
                </div>
              </div>
            </DetailSection>

            <DetailSection icon={<Clock className="size-3" />} title="Timeline">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Time In:</span> {formatTime(flyoutVisitor.time_in)}</div>
                <div>
                  <span className="text-muted-foreground">Time Out:</span>{' '}
                  {flyoutVisitor.time_out ? (
                    formatTime(flyoutVisitor.time_out)
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-900 dark:border-emerald-800/30 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <Circle className="size-2 fill-current" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Status">
              <div className="flex items-center gap-2 text-sm">
                {flyoutVisitor.time_out ? (
                  <span className="inline-flex items-center rounded-md bg-muted px-3 py-0.5 text-xs font-bold text-muted-foreground">
                    Checked Out
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-900 dark:border-emerald-800/30 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Circle className="size-2 fill-current" />
                    Active
                  </span>
                )}
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
