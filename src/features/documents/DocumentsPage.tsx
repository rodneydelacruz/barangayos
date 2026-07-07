import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronDown, FileText, Clock, User, CheckCircle2, RotateCcw, Ban, DollarSign } from 'lucide-react'
import { getDocuments, createDocument, updateDocument, deleteDocument, getDailyQueueNumber, type ApiDocument } from '@/api/documents'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ResidentCombobox } from '@/components/ui/ResidentCombobox'
import { hasRole } from '@/auth/session'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { documentStatusColors } from '@/lib/statusStyles'

const documentTypeOptions = [
  { value: 'barangay_clearance', label: 'Barangay Clearance' },
  { value: 'business_permit', label: 'Business Permit' },
  { value: 'certificate_of_indigency', label: 'Certificate of Indigency' },
  { value: 'certificate_of_residency', label: 'Certificate of Residency' },
  { value: 'certificate_of_good_moral', label: 'Certificate of Good Moral' },
  { value: 'cedula', label: 'Cedula' },
  { value: 'other', label: 'Other' },
]

const statusOptions = ['pending', 'processing', 'for_release', 'released', 'cancelled']

const statusColors: Record<string, string> = {
  pending: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  processing: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  for_release: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  released: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  for_release: 'For Release',
  released: 'Released',
  cancelled: 'Cancelled',
}

function emptyForm() {
  return {
    queue_number: '',
    resident_id: '',
    resident_name: '',
    document_type: '',
    other_document_type: '',
    purpose: '',
    notes: '',
  }
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  useBodyScrollLock(panelOpen)
  const [error, setError] = useState<string | null>(null)
  const [flyoutDoc, setFlyoutDoc] = useState<ApiDocument | null>(null)
  

  useEffect(() => {
    getDocuments()
      .then(setDocs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && docs.length > 0) {
      const record = docs.find(d => d.id === selectedId)
      if (record) {
        setFlyoutDoc(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, docs])

  function updateField(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.document_type || !form.purpose.trim()) return
    if (!form.resident_id && !form.resident_name.trim()) return

    try {
      if (editingId) {
        const updated = await updateDocument(editingId, form)
        setDocs((prev) => prev.map((d) => (d.id === editingId ? updated : d)))
      } else {
        const qn = await getDailyQueueNumber()
        const created = await createDocument({ ...form, queue_number: qn, status: 'pending', payment_status: 'unpaid' })
        setDocs((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document request')
    }
  }

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiDocument) {
    setEditingId(record.id)
    setForm({
      queue_number: record.queue_number,
      resident_id: record.resident_id,
      resident_name: record.resident_name,
      document_type: record.document_type,
      other_document_type: record.other_document_type,
      purpose: record.purpose,
      notes: record.notes,
    })
    setPanelOpen(true)
    setError(null)
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const payload: Partial<Record<string, unknown>> = { status: newStatus }
      if (newStatus === 'released') {
        payload.released_at = new Date().toISOString()
      }
      const updated = await updateDocument(id, payload)
      setDocs((prev) => prev.map((d) => (d.id === id ? updated : d)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteDocument(deletingId)
      setDocs((prev) => prev.filter((d) => d.id !== deletingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document request')
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
    setFlyoutDoc(null)
  }

  const documentsColumns: Column<ApiDocument>[] = [
    { key: 'control_number', label: 'Queue #', sortable: true, filterType: 'text',
      filterValue: (d) => `#${d.queue_number}`,
      render: (d) => `#${d.queue_number}` },
    { key: 'resident_name', label: 'Resident', sortable: true, filterType: 'text',
      filterValue: (d) => `${d.last_name ?? ''}, ${d.first_name ?? ''}`,
      render: (d) => `${d.last_name ?? ''}, ${d.first_name ?? ''}` },
    { key: 'document_type', label: 'Document Type', sortable: true, hideBelow: 'sm', filterType: 'select',
      filterOptions: [
        { label: 'Barangay Clearance', value: 'barangay_clearance' },
        { label: 'Business Permit', value: 'business_permit' },
        { label: 'Certificate of Indigency', value: 'certificate_of_indigency' },
        { label: 'Certificate of Residency', value: 'certificate_of_residency' },
        { label: 'Certificate of Good Moral', value: 'certificate_of_good_moral' },
        { label: 'Cedula', value: 'cedula' },
        { label: 'Other', value: 'other' },
      ] },
    { key: 'status', label: 'Status',
      render: (d) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${documentStatusColors[d.status] ?? ''}`}>
          {d.status.replace(/_/g, ' ')}
        </span>
      ),
      filterType: 'select',
      filterOptions: [
        { label: 'Pending', value: 'pending' }, { label: 'Processing', value: 'processing' },
        { label: 'For Release', value: 'for_release' }, { label: 'Released', value: 'released' },
        { label: 'Cancelled', value: 'cancelled' },
      ] },
    { key: 'payment_status', label: 'Payment', hideBelow: 'sm', filterType: 'select',
      filterOptions: [
        { label: 'Paid', value: 'paid' }, { label: 'Unpaid', value: 'unpaid' },
        { label: 'Waived', value: 'waived' },
      ] },
    { key: 'created', label: 'Requested', filterType: 'date', render: (d) => d.created ? new Date(d.created).toLocaleDateString() : '', hideBelow: 'md' },
  ]

  return (
    <>
      <PageHeader title="Document Queue" subtitle="Manage document requests and track processing status.">
        {canModify && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            New Request
          </Button>
        )}
      </PageHeader>

      <Card lifted={false} className="shadow-none">
        
        <CardContent className="p-0">
          <DataTable
            columns={documentsColumns}
            data={docs}
            loading={loading}
            onRowClick={(d) => setFlyoutDoc(d)}
            emptyState={
              <EmptyState
                title="No document requests yet."
                action={canModify && docs.length === 0 ? { label: "Create first request", onClick: openCreatePanel } : undefined}
              />
            }
            toolbar
            exportable
            rowKey={(d) => d.id}
          />
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">{editingId ? 'Edit Request' : 'New Document Request'}</h2>
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
                <Label>Resident *</Label>
                <ResidentCombobox
                  value={form.resident_name}
                  onChange={(v) => { updateField('resident_name', v); if (!v) updateField('resident_id', '') }}
                  onSelectResident={(r) => { updateField('resident_id', r.id); updateField('resident_name', `${r.first_name} ${r.last_name}`) }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-doc-type">Document Type *</Label>
                <Select
                  id="panel-doc-type"
                  value={form.document_type}
                  onValueChange={(v) => updateField('document_type', v)}
                >
                  <option value="">Select type</option>
                  {documentTypeOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>

              {form.document_type === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="panel-other-type">Specify Document Type</Label>
                  <Input
                    id="panel-other-type"
                    value={form.other_document_type}
                    onChange={(e) => updateField('other_document_type', e.target.value)}
                    placeholder="Enter document type"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="panel-purpose">Purpose *</Label>
                <textarea
                  id="panel-purpose"
                  value={form.purpose}
                  onChange={(e) => updateField('purpose', e.target.value)}
                  rows={3}
                  required
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="State the purpose of the request..."
                />
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
                <Button type="submit">{editingId ? 'Update' : 'Create Request'}</Button>
                <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailPanel
        open={flyoutDoc !== null}
        onClose={closeFlyout}
        title={flyoutDoc ? `#${flyoutDoc.queue_number} - ${flyoutDoc.resident_name}` : ''}
        onEdit={canModify && flyoutDoc ? () => { openEditPanel(flyoutDoc); closeFlyout() } : undefined}
        onDelete={canModify && flyoutDoc ? () => handleDelete(flyoutDoc.id) : undefined}
      >
        {flyoutDoc && (
          <>
            <DetailSection icon={<FileText className="size-3" />} title="Document Info">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Queue #:</span> <span className="font-medium">#{flyoutDoc.queue_number}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{flyoutDoc.document_type.replace(/_/g, ' ')}</span></div>
                {flyoutDoc.other_document_type && <div className="col-span-2"><span className="text-muted-foreground">Specified:</span> {flyoutDoc.other_document_type}</div>}
                <div className="col-span-2"><span className="text-muted-foreground">Status:</span> <span className={cn('inline-flex rounded-md px-3.5 py-0.5 text-xs font-bold', statusColors[flyoutDoc.status])}>{statusLabels[flyoutDoc.status]}</span></div>
              </div>
            </DetailSection>

            <DetailSection icon={<User className="size-3" />} title="Resident">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2"><span className="text-muted-foreground">Name:</span> {flyoutDoc.resident_name}</div>
              </div>
            </DetailSection>

            <DetailSection icon={<FileText className="size-3" />} title="Purpose">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyoutDoc.purpose}</p>
            </DetailSection>

            <DetailSection icon={<DollarSign className="size-3" />} title="Payment">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className={cn('inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold', {
                    'bg-amber-100 text-amber-800': flyoutDoc.payment_status === 'unpaid',
                    'bg-emerald-100 text-emerald-800': flyoutDoc.payment_status === 'paid',
                    'bg-muted text-muted-foreground': flyoutDoc.payment_status === 'waived',
                  })}>
                    {flyoutDoc.payment_status === 'unpaid' ? 'Unpaid' : flyoutDoc.payment_status === 'paid' ? 'Paid' : 'Waived'}
                  </span>
                </div>
                {flyoutDoc.payment_status === 'paid' && (
                  <>
                    <div><span className="text-muted-foreground">Amount:</span> ₱{flyoutDoc.payment_amount.toFixed(2)}</div>
                    {flyoutDoc.or_no && <div className="col-span-2"><span className="text-muted-foreground">O.R. #:</span> {flyoutDoc.or_no}</div>}
                    <div className="col-span-2"><span className="text-muted-foreground">Date:</span> {flyoutDoc.payment_date ? formatDate(flyoutDoc.payment_date) : '-'}</div>
                  </>
                )}
              </div>
            </DetailSection>

            {flyoutDoc.notes && (
              <DetailSection title="Notes">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyoutDoc.notes}</p>
              </DetailSection>
            )}

            {canModify && flyoutDoc.status !== 'released' && flyoutDoc.status !== 'cancelled' && (
              <DetailSection icon={<RotateCcw className="size-3" />} title="Actions">
                <div className="flex flex-wrap gap-2">
                  {flyoutDoc.status === 'pending' && (
                    <Button size="sm" className="gap-1.5" onClick={() => { handleStatusChange(flyoutDoc.id, 'processing'); closeFlyout() }}>
                      <CheckCircle2 className="size-3.5" />
                      Process
                    </Button>
                  )}
                  {flyoutDoc.status === 'processing' && (
                    <Button size="sm" className="gap-1.5" onClick={() => { handleStatusChange(flyoutDoc.id, 'for_release'); closeFlyout() }}>
                      <CheckCircle2 className="size-3.5" />
                      Ready for Release
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => { handleStatusChange(flyoutDoc.id, 'cancelled'); closeFlyout() }}>
                    <Ban className="size-3.5" />
                    Cancel
                  </Button>
                </div>
              </DetailSection>
            )}

            <DetailSection icon={<Clock className="size-3" />} title="Timeline">
              <div className="space-y-1 text-sm">
                <div><span className="text-muted-foreground">Requested:</span> {formatDateTime(flyoutDoc.requested_at)}</div>
                {flyoutDoc.released_at && <div><span className="text-muted-foreground">Released:</span> {formatDateTime(flyoutDoc.released_at)}</div>}
              </div>
            </DetailSection>

            <DetailSection title="Metadata">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Created: {formatDateTime(flyoutDoc.created)}</div>
                <div>Updated: {formatDateTime(flyoutDoc.updated)}</div>
              </div>
            </DetailSection>
          </>
        )}
      </DetailPanel>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete request"
        message="This action cannot be undone. The document request will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
