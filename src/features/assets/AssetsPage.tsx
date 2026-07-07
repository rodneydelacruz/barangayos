import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronDown, Camera, X, ClipboardList, Tag, MapPin } from 'lucide-react'
import { getAssets, createAsset, updateAsset, deleteAsset, type ApiAsset } from '@/api/assets'

import { uploadImage } from '@/api/upload'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { assetConditionColors, assetStatusColors } from '@/lib/statusStyles'

const assetTypeOptions = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'it_equipment', label: 'IT Equipment' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'facility', label: 'Facility' },
  { value: 'tool', label: 'Tool' },
  { value: 'other', label: 'Other' },
]

const conditionOptions = ['new', 'good', 'fair', 'poor', 'damaged', 'disposed']

const conditionLabels: Record<string, string> = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  damaged: 'Damaged',
  disposed: 'Disposed',
}

const conditionColors: Record<string, string> = {
  new: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  good: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  fair: 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30',
  poor: 'bg-orange-200 text-orange-900 border border-orange-400 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800/30',
  damaged: 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30',
  disposed: 'bg-muted text-muted-foreground',
}

const statusOptions = ['available', 'assigned', 'disposed']

const statusLabels: Record<string, string> = {
  available: 'Available',
  assigned: 'Assigned',
  disposed: 'Disposed',
}

const statusColors: Record<string, string> = {
  available: 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30',
  assigned: 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30',
  disposed: 'bg-muted text-muted-foreground',
}

function emptyForm() {
  return {
    name: '',
    asset_type: '',
    description: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: 0,
    current_value: 0,
    condition: '',
    status: 'available',
    assigned_to: '',
    location: '',
    image_url: '',
    notes: '',
  }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<ApiAsset[]>([])

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  useBodyScrollLock(panelOpen)
  const [error, setError] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [flyoutAsset, setFlyoutAsset] = useState<ApiAsset | null>(null)


  useEffect(() => {
    getAssets()
      .then((assetsData) => setAssets(assetsData))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && assets.length > 0) {
      const record = assets.find(a => a.id === selectedId)
      if (record) {
        openFlyout(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, assets])

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      updateField('image_url', url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  function clearImage() {
    updateField('image_url', '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.asset_type || !form.condition) return

    const payload = {
      ...form,
      purchase_date: form.purchase_date || null,
      serial_number: form.serial_number || null,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      location: form.location || null,
      image_url: form.image_url || null,
      notes: form.notes || null,
    }

    try {
      if (editingId) {
        const updated = await updateAsset(editingId, payload)
        setAssets((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
      } else {
        const created = await createAsset(payload)
        setAssets((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save asset')
    }
  }

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiAsset) {
    setEditingId(record.id)
    setForm({
      name: record.name,
      asset_type: record.asset_type,
      description: record.description ?? '',
      serial_number: record.serial_number ?? '',
      purchase_date: record.purchase_date ?? '',
      purchase_cost: record.purchase_cost ?? 0,
      current_value: record.current_value ?? 0,
      condition: record.condition,
      status: record.status ?? 'available',
      assigned_to: record.assigned_to ?? '',
      location: record.location ?? '',
      image_url: record.image_url ?? '',
      notes: record.notes ?? '',
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
      await deleteAsset(deletingId)
      setAssets((prev) => prev.filter((a) => a.id !== deletingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset')
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

  const isAdmin = hasRole('admin')

  function openFlyout(asset: ApiAsset) {
    setFlyoutAsset(asset)
  }

  function closeFlyout() {
    setFlyoutAsset(null)
  }

  const assetColumns: Column<ApiAsset>[] = [
    { key: 'name', label: 'Asset Name', sortable: true, filterType: 'text',
      render: (a) => (
        <div className="flex items-center gap-3">
          {a.image_url ? (
            <img src={a.image_url} alt="" className="size-8 rounded object-cover" />
          ) : (
            <div className="size-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">NA</div>
          )}
          <span>{a.name}</span>
        </div>
      ) },
    { key: 'asset_type', label: 'Type', sortable: true, hideBelow: 'sm', filterType: 'select',
      filterOptions: assetTypeOptions.map(t => ({ label: t.label, value: t.value })) },
    { key: 'condition', label: 'Condition', filterType: 'select',
      filterOptions: conditionOptions.map(c => ({ label: conditionLabels[c] || c, value: c })),
      render: (a) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${assetConditionColors[a.condition] ?? ''}`}>{a.condition}</span>
      ) },
    { key: 'status', label: 'Status', filterType: 'select',
      filterOptions: statusOptions.map(s => ({ label: statusLabels[s] || s, value: s })),
      render: (a) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${assetStatusColors[a.status!] ?? ''}`}>{a.status}</span>
      ) },
    { key: 'assigned_to', label: 'Assigned To', render: (a) => a.assigned_to ?? '—', hideBelow: 'sm', filterType: 'text' },
  ]

  return (
    <>
      <PageHeader title="Assets" subtitle="Manage barangay equipment, furniture, vehicles, and other assets.">
        {isAdmin && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            Add Asset
          </Button>
        )}
      </PageHeader>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card lifted={false} className="shadow-none">
        
        <CardContent className="p-0">
          <DataTable
            columns={assetColumns}
            data={assets}
            loading={loading}
            onRowClick={(a) => openFlyout(a)}
            emptyState={
              <EmptyState
                title="No assets yet. Add your first asset."
                action={isAdmin && assets.length === 0 ? { label: "Add first asset", onClick: openCreatePanel } : undefined}
              />
            }
            rowKey={(a) => a.id}
            toolbar
            exportable
          />
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">{editingId ? 'Edit Asset' : 'Add Asset'}</h2>
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
                <Label htmlFor="panel-name">Name *</Label>
                <Input
                  id="panel-name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Asset name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-type">Type *</Label>
                <Select
                  id="panel-type"
                  value={form.asset_type}
                  onValueChange={(v) => updateField('asset_type', v)}
                >
                  <option value="">Select type</option>
                  {assetTypeOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-description">Description</Label>
                <textarea
                  id="panel-description"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the asset..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-serial">Serial Number</Label>
                  <Input
                    id="panel-serial"
                    value={form.serial_number}
                    onChange={(e) => updateField('serial_number', e.target.value)}
                    placeholder="Serial #"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-purchase-date">Purchase Date</Label>
                  <Input
                    id="panel-purchase-date"
                    type="date"
                    value={form.purchase_date}
                    onChange={(e) => updateField('purchase_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-purchase-cost">Purchase Cost</Label>
                  <Input
                    id="panel-purchase-cost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.purchase_cost}
                    onChange={(e) => updateField('purchase_cost', Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-current-value">Current Value</Label>
                  <Input
                    id="panel-current-value"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.current_value}
                    onChange={(e) => updateField('current_value', Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-condition">Condition *</Label>
                  <Select
                    id="panel-condition"
                    value={form.condition}
                    onValueChange={(v) => updateField('condition', v)}
                  >
                    <option value="">Select condition</option>
                    {conditionOptions.map((c) => (
                      <option key={c} value={c}>{conditionLabels[c]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-status">Status</Label>
                  <Select
                    id="panel-status"
                    value={form.status}
                    onValueChange={(v) => updateField('status', v)}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Input
                  placeholder="Enter name..."
                  value={form.assigned_to}
                  onChange={(e) => updateField('assigned_to', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-20 w-20 shrink-0">
                      {form.image_url ? (
                        <div className="relative">
                          <img src={form.image_url} alt="Preview" className="h-20 w-20 rounded object-cover" />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-white"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded border border-dashed text-muted-foreground hover:bg-muted/50">
                          <Camera className="size-6" />
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-location">Location</Label>
                <Input
                  id="panel-location"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Office, Stockroom"
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
                <Button type="submit">{editingId ? 'Update' : 'Add Asset'}</Button>
                <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailPanel
        open={flyoutAsset !== null}
        onClose={closeFlyout}
        title={flyoutAsset?.name ?? ''}
        onEdit={isAdmin && flyoutAsset ? () => { openEditPanel(flyoutAsset); closeFlyout() } : undefined}
        onDelete={isAdmin && flyoutAsset ? () => handleDelete(flyoutAsset.id) : undefined}
      >
        {flyoutAsset && (
          <>
            <DetailSection icon={<Camera className="size-3" />} title="Image">
              {flyoutAsset.image_url ? (
                <img src={flyoutAsset.image_url} alt="" className="h-32 w-full rounded object-cover" />
              ) : (
                <p className="text-muted-foreground">No image</p>
              )}
            </DetailSection>

            <DetailSection icon={<ClipboardList className="size-3" />} title="Details">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{flyoutAsset.name}</span></div>
                <div><span className="text-muted-foreground">Type:</span> {assetTypeOptions.find((t) => t.value === flyoutAsset.asset_type)?.label || flyoutAsset.asset_type}</div>
                <div><span className="text-muted-foreground">Serial #:</span> {flyoutAsset.serial_number || '—'}</div>
                <div><span className="text-muted-foreground">Condition:</span> <span className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', conditionColors[flyoutAsset.condition])}>{conditionLabels[flyoutAsset.condition]}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', statusColors[flyoutAsset.status ?? ''])}>{statusLabels[flyoutAsset.status ?? '']}</span></div>
              </div>
            </DetailSection>

            <DetailSection icon={<Tag className="size-3" />} title="Valuation">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Purchase Cost:</span> {flyoutAsset.purchase_cost ? `₱${Number(flyoutAsset.purchase_cost).toLocaleString()}` : '—'}</div>
                <div><span className="text-muted-foreground">Current Value:</span> {flyoutAsset.current_value ? `₱${Number(flyoutAsset.current_value).toLocaleString()}` : '—'}</div>
                <div><span className="text-muted-foreground">Purchase Date:</span> {formatDate(flyoutAsset.purchase_date)}</div>
              </div>
            </DetailSection>

            <DetailSection icon={<MapPin className="size-3" />} title="Assignment">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Assigned To:</span> {flyoutAsset.assigned_to || '—'}</div>
                <div><span className="text-muted-foreground">Location:</span> {flyoutAsset.location || '—'}</div>
              </div>
            </DetailSection>

            {flyoutAsset.description && (
              <DetailSection title="Description">
                <p className="text-sm text-muted-foreground">{flyoutAsset.description}</p>
              </DetailSection>
            )}

            {flyoutAsset.notes && (
              <DetailSection title="Notes">
                <p className="text-sm text-muted-foreground">{flyoutAsset.notes}</p>
              </DetailSection>
            )}

            <DetailSection title="Metadata">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Created: {formatDateTime(flyoutAsset.created)}</div>
                <div>Updated: {formatDateTime(flyoutAsset.updated)}</div>
              </div>
            </DetailSection>
          </>
        )}
      </DetailPanel>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete asset"
        message="This action cannot be undone. The asset will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
