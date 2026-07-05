import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, Search, Camera, X } from 'lucide-react'
import { getAssets, createAsset, updateAsset, deleteAsset, type ApiAsset } from '@/api/assets'
import { getResidents, type ApiResident } from '@/api/residents'
import { uploadImage } from '@/api/upload'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'
import { cn } from '@/lib/utils'

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
  new: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  fair: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  poor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  damaged: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  disposed: 'bg-muted text-muted-foreground',
}

const statusOptions = ['available', 'assigned', 'disposed']

const statusLabels: Record<string, string> = {
  available: 'Available',
  assigned: 'Assigned',
  disposed: 'Disposed',
}

const statusColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
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
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [conditionFilter, setConditionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [residentSearch, setResidentSearch] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    Promise.all([
      getAssets(),
      getResidents(),
    ])
      .then(([assetsData, residentsData]) => {
        setAssets(assetsData)
        setResidents(residentsData)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (search) {
        const q = search.toLowerCase()
        if (!a.name.toLowerCase().includes(q)) return false
      }
      if (typeFilter && a.asset_type !== typeFilter) return false
      if (conditionFilter && a.condition !== conditionFilter) return false
      if (statusFilter && a.status !== statusFilter) return false
      return true
    })
  }, [assets, search, typeFilter, conditionFilter, statusFilter])

  const filteredResidents = useMemo(() => {
    if (!residentSearch) return residents.slice(0, 10)
    const q = residentSearch.toLowerCase()
    return residents.filter((r) =>
      `${r.first_name} ${r.last_name} ${r.middle_name}`.toLowerCase().includes(q),
    ).slice(0, 10)
  }, [residents, residentSearch])

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

    try {
      if (editingId) {
        const updated = await updateAsset(editingId, form)
        setAssets((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
      } else {
        const created = await createAsset(form)
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
    setResidentSearch('')
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiAsset) {
    setEditingId(record.id)
    setForm({
      name: record.name,
      asset_type: record.asset_type,
      description: record.description,
      serial_number: record.serial_number,
      purchase_date: record.purchase_date,
      purchase_cost: record.purchase_cost,
      current_value: record.current_value,
      condition: record.condition,
      status: record.status,
      assigned_to: record.assigned_to,
      location: record.location,
      image_url: record.image_url,
      notes: record.notes,
    })
    setResidentSearch('')
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

  function selectResident(r: ApiResident) {
    updateField('assigned_to', r.id)
    setResidentSearch(`${r.first_name} ${r.last_name}`)
  }

  const isAdmin = hasRole('admin')

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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-60 max-w-full pl-8 text-sm"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v)}
          className="h-9 w-40 text-sm"
        >
          <option value="">All Types</option>
          {assetTypeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
        <Select
          value={conditionFilter}
          onValueChange={(v) => setConditionFilter(v)}
          className="h-9 w-40 text-sm"
        >
          <option value="">All Conditions</option>
          {conditionOptions.map((c) => (
            <option key={c} value={c}>{conditionLabels[c]}</option>
          ))}
        </Select>
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
          <CardTitle>Asset Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4 sm:p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded border p-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="size-10 shrink-0 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 flex-1 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-14 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No assets yet. Add your first asset.</p>
              {isAdmin && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreatePanel}>
                  <Plus className="size-3.5" />
                  Add first asset
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Image</th>
                    <th className="px-4 py-3 sm:px-6">Name</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Type</th>
                    <th className="px-4 py-3 sm:px-6">Condition</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Location</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={filteredAssets.length === 0 ? 'hidden' : ''}>
                  {filteredAssets.map((a, i) => (
                    <tr
                      key={a.id}
                      className="border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up"
                      style={{ '--stagger-index': i } as React.CSSProperties}
                    >
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        {a.image_url ? (
                          <img src={a.image_url} alt="" className="size-10 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                            <Camera className="size-4" />
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm font-medium text-foreground">
                        {a.name}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                        {assetTypeOptions.find((t) => t.value === a.asset_type)?.label || a.asset_type}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', conditionColors[a.condition])}>
                          {conditionLabels[a.condition]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[a.status])}>
                          {statusLabels[a.status]}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                        {a.location || '\u2014'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right">
                        {isAdmin && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0"
                              onClick={() => openEditPanel(a)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(a.id)}
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
              {filteredAssets.length === 0 && assets.length > 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No assets match your filters.</p>
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
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Asset' : 'Add Asset'}</h2>
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
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search resident..."
                    value={residentSearch}
                    onChange={(e) => {
                      setResidentSearch(e.target.value)
                      if (!e.target.value) {
                        updateField('assigned_to', '')
                      }
                    }}
                    className="h-9 pl-8 text-sm"
                  />
                  {residentSearch && !editingId && (
                    <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-card shadow-lg">
                      {filteredResidents.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No residents found</p>
                      ) : (
                        filteredResidents.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => selectResident(r)}
                          >
                            {r.first_name} {r.last_name}
                            {r.purok && (
                              <span className="ml-auto text-xs text-muted-foreground">{r.purok}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="fbold h-20 w-20 shrink-0">
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
