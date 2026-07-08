import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronDown, DoorOpen, LogOut, User, Clock } from 'lucide-react'
import { getVisitors, createVisitor, updateVisitor, deleteVisitor, checkOutVisitor, type ApiVisitor } from '@/api/visitors'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hasRole } from '@/auth/session'
import { formatDateTime } from '@/lib/utils'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'

const statusStyles = {
  checkedIn:
    'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  checkedOut: 'bg-muted text-muted-foreground border border-border',
}

function emptyForm() {
  return {
    visitor_name: '',
    contact_number: '',
    purpose: '',
    person_to_visit: '',
  }
}

export default function VisitorLogPage() {
  const [visitors, setVisitors] = useState<ApiVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  useBodyScrollLock(panelOpen)
  const [error, setError] = useState<string | null>(null)
  const [flyoutVisitor, setFlyoutVisitor] = useState<ApiVisitor | null>(null)

  useEffect(() => {
    getVisitors()
      .then((data) => setVisitors(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load visitors'),
      )
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && visitors.length > 0) {
      const record = visitors.find((v) => v.id === selectedId)
      if (record) {
        setFlyoutVisitor(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, visitors])

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

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setPanelOpen(true)
  }

  function openEditPanel(visitor: ApiVisitor) {
    setEditingId(visitor.id)
    setForm({
      visitor_name: visitor.visitor_name,
      contact_number: visitor.contact_number ?? '',
      purpose: visitor.purpose,
      person_to_visit: visitor.person_to_visit ?? '',
    })
    setPanelOpen(true)
    setError(null)
  }

  async function handleCheckOut(id: string) {
    try {
      const updated = await checkOutVisitor(id)
      setVisitors((prev) => prev.map((v) => (v.id === id ? updated : v)))
      if (flyoutVisitor?.id === id) {
        setFlyoutVisitor(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out visitor')
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteVisitor(deletingId)
      setVisitors((prev) => prev.filter((v) => v.id !== deletingId))
      if (flyoutVisitor?.id === deletingId) {
        setFlyoutVisitor(null)
      }
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

  const checkInButton = canModify ? (
    <Button variant="ghost" size="sm" className="gap-0.5 rounded-md text-blue-400 hover:text-blue-300 h-6 text-xs" onClick={openCreatePanel}>
      <DoorOpen className="size-3" />
      Check In
    </Button>
  ) : null

  const visitorColumns: Column<ApiVisitor>[] = [
    {
      key: 'visitor_name',
      label: 'Visitor Name',
      sortable: true,
      filterType: 'text',
      render: (v) => (
        <div className="flex items-center gap-1.5">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="size-3" />
          </div>
          <span className="font-medium text-xs">{v.visitor_name}</span>
        </div>
      ),
    },
    {
      key: 'contact_number',
      label: 'Contact',
      hideBelow: 'sm',
      filterType: 'text',
      render: (v) => v.contact_number || '—',
    },
    {
      key: 'purpose',
      label: 'Purpose',
      sortable: true,
      filterType: 'text',
    },
    {
      key: 'person_to_visit',
      label: 'Person to Visit',
      filterType: 'text',
      render: (v) => v.person_to_visit || '—',
    },
    {
      key: 'time_in',
      label: 'Time In',
      sortable: true,
      render: (v) => formatDateTime(v.time_in),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <span
          className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${v.time_out ? statusStyles.checkedOut : statusStyles.checkedIn}`}
        >
          {v.time_out ? 'Completed' : 'Active'}
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="-ml-4 -mr-4 sm:-ml-6 sm:-mr-6 lg:-ml-8 lg:-mr-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-56px)] h-[calc(100dvh-60px)] md:h-[calc(100dvh-52px)] flex flex-col overflow-hidden">
        {error && (
          <div className="shrink-0 rounded-none bg-destructive/10 px-4 py-2 text-xs text-destructive motion-fade-in">
            {error}
          </div>
        )}
        <DataTable
          title="VISITOR LOGS"
          toolbarActions={checkInButton}
          columns={visitorColumns}
          data={visitors}
          loading={loading}
          onRowClick={(v) => setFlyoutVisitor(v)}
          emptyState={
            <EmptyState
              title="No visitors yet"
              description="Check in your first visitor."
              action={
                canModify && visitors.length === 0
                  ? {
                      label: 'Check in visitor',
                      onClick: openCreatePanel,
                    }
                  : undefined
              }
            />
          }
          rowKey={(v) => v.id}
          toolbar
          exportable
        />
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div
            className="fixed inset-0 bg-black/40 motion-fade-in"
            onClick={closePanel}
            aria-hidden="true"
          />
          <div className="relative w-full overflow-y-auto bg-card shadow-xl motion-slide-up motion-fade-in md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">
                {editingId ? 'Edit Visitor' : 'Check In Visitor'}
              </h2>
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
                <Input
                  id="panel-visitor-name"
                  value={form.visitor_name}
                  onChange={(e) => updateField('visitor_name', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-contact">Contact Number</Label>
                <Input
                  id="panel-contact"
                  value={form.contact_number ?? ''}
                  onChange={(e) => updateField('contact_number', e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-purpose">Purpose *</Label>
                <Input
                  id="panel-purpose"
                  value={form.purpose}
                  onChange={(e) => updateField('purpose', e.target.value)}
                  placeholder="e.g. Document request, Inquiry, Meeting"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-person">Person to Visit</Label>
                <Input
                  id="panel-person"
                  value={form.person_to_visit ?? ''}
                  onChange={(e) => updateField('person_to_visit', e.target.value)}
                  placeholder="Name of person to visit"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Check In'}
                </Button>
                <Button type="button" variant="outline" onClick={closePanel}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailPanel
        open={flyoutVisitor !== null}
        onClose={() => setFlyoutVisitor(null)}
        title={flyoutVisitor?.visitor_name ?? ''}
        onEdit={
          canModify && flyoutVisitor
            ? () => {
                openEditPanel(flyoutVisitor)
                setFlyoutVisitor(null)
              }
            : undefined
        }
        onDelete={
          canModify && flyoutVisitor
            ? () => handleDelete(flyoutVisitor.id)
            : undefined
        }
      >
        {flyoutVisitor && (
          <>
            <DetailSection icon={<User className="size-3" />} title="Visitor Info">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{flyoutVisitor.visitor_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact:</span>{' '}
                  {flyoutVisitor.contact_number || '—'}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Purpose:</span>{' '}
                  {flyoutVisitor.purpose}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Person to Visit:</span>{' '}
                  {flyoutVisitor.person_to_visit || '—'}
                </div>
              </div>
            </DetailSection>

            <DetailSection icon={<Clock className="size-3" />} title="Timeline">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Time In:</span>{' '}
                  {formatDateTime(flyoutVisitor.time_in)}
                </div>
                <div>
                  <span className="text-muted-foreground">Time Out:</span>{' '}
                  {flyoutVisitor.time_out ? (
                    formatDateTime(flyoutVisitor.time_out)
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles.checkedIn}`}
                    >
                      Active
                    </span>
                  )}
                </div>
              </div>
            </DetailSection>

            {!flyoutVisitor.time_out && canModify && (
              <div className="pt-2">
                <Button
                  className="w-full gap-1.5"
                  variant="outline"
                  onClick={() => handleCheckOut(flyoutVisitor.id)}
                >
                  <LogOut className="size-3.5" />
                  Check Out
                </Button>
              </div>
            )}

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
        title="Delete visitor record"
        message="This action cannot be undone. The visitor record will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
