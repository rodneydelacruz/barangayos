import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Home, Users } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'
import { getHouseholds, getNextHouseholdNumber, createHousehold, updateHousehold, deleteHousehold, type ApiHousehold } from '@/api/households'
import { getResidents, type ApiResident } from '@/api/residents'
import { ResidentCombobox } from '@/components/ui/ResidentCombobox'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'
import { cn, formatDateTime } from '@/lib/utils'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { SortSelect } from '@/components/ui/SortSelect'

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const bd = new Date(birthDate)
  let age = today.getFullYear() - bd.getFullYear()
  const m = today.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--
  return Math.max(0, age)
}

const purokOptions = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7']

const tagKeys = ['is_voter', 'is_4ps', 'is_senior', 'is_pwd'] as const
const tagLabels: Record<string, string> = {
  is_voter: 'Voter',
  is_4ps: '4Ps',
  is_senior: 'Senior',
  is_pwd: 'PWD',
}
const tagColors: Record<string, string> = {
  is_voter: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
  is_4ps: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
  is_senior: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30',
  is_pwd: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/30',
}

function emptyForm() {
  return {
    household_number: '',
    purok: '',
    head_name: '',
    address: '',
    notes: '',
  }
}

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<ApiHousehold[]>([])
  const [residentsMap, setResidentsMap] = useState<Map<string, ApiResident[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [purokFilter, setPurokFilter] = useState('')
  const [flyoutHousehold, setFlyoutHousehold] = useState<ApiHousehold | null>(null)
  const [sortBy, setSortBy] = useState('-created')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getHouseholds(),
      getResidents(),
    ])
      .then(([h, r]) => {
        setHouseholds(h)
        const map = new Map<string, ApiResident[]>()
        for (const resident of r) {
          const hid = resident.household_id
          if (hid) {
            const existing = map.get(hid) || []
            existing.push(resident)
            map.set(hid, existing)
          }
        }
        setResidentsMap(map)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load households'))
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && households.length > 0) {
      const record = households.find(h => h.id === selectedId)
      if (record) {
        setFlyoutHousehold(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, households])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.household_number.trim() || !form.head_name.trim()) return

    try {
      if (editingId) {
        const updated = await updateHousehold(editingId, form)
        setHouseholds((prev) =>
          prev.map((h) => (h.id === editingId ? updated : h)),
        )
      } else {
        const created = await createHousehold(form)
        setHouseholds((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save household')
    }
  }

  async function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    const num = await getNextHouseholdNumber()
    setForm((prev) => ({ ...prev, household_number: num }))
    setPanelOpen(true)
  }

  function openEditPanel(household: ApiHousehold) {
    setEditingId(household.id)
    setForm({
      household_number: household.household_number,
      purok: household.purok,
      head_name: household.head_name,
      address: household.address,
      notes: household.notes,
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
      await deleteHousehold(deletingId)
      setHouseholds((prev) => prev.filter((h) => h.id !== deletingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete household')
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
    { value: 'household_number', label: 'Household #' },
    { value: 'purok', label: 'Purok' },
    { value: 'head_name', label: 'Head Name' },
    { value: '-created', label: 'Newest' },
  ]

  function closeFlyout() {
    setFlyoutHousehold(null)
  }

  const filteredHouseholds = useMemo(() => {
    const sorted = [...households].sort((a, b) => {
      const desc = sortBy.startsWith('-')
      const field = desc ? sortBy.slice(1) : sortBy
      const va: string = (a as Record<string, unknown>)[field] as string || ''
      const vb: string = (b as Record<string, unknown>)[field] as string || ''
      const cmp = va.localeCompare(vb)
      return desc ? -cmp : cmp
    })
    return sorted.filter((h) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !h.household_number.toLowerCase().includes(q) &&
          !h.head_name.toLowerCase().includes(q) &&
          !(h.purok && h.purok.toLowerCase().includes(q))
        ) return false
      }
      if (purokFilter && h.purok !== purokFilter) return false
      return true
    })
  }, [households, search, purokFilter, sortBy])

  const totalPages = Math.ceil(filteredHouseholds.length / PAGE_SIZE)
  const paginatedHouseholds = filteredHouseholds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, purokFilter, sortBy])

  return (
    <>
      <PageHeader title="Households" subtitle="Manage household records and view member information.">
        {canModify && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            New Household
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by household #, head name, or purok..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-80 max-w-full text-sm"
        />
        <Select
          value={purokFilter}
          onValueChange={(v) => setPurokFilter(v)}
          className="h-9 w-40 text-sm"
        >
          <option value="">All Puroks</option>
          {purokOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <SortSelect options={sortFields} value={sortBy} onChange={setSortBy} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Household Records</CardTitle>
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
          ) : households.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No households yet.</p>
              {canModify && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreatePanel}>
                  <Plus className="size-3.5" />
                  Create first household
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Household #</th>
                    <th className="px-4 py-3 sm:px-6">Purok</th>
                    <th className="px-4 py-3 sm:px-6">Head Name</th>
                    <th className="px-4 py-3 sm:px-6">Members</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHouseholds.map((h, i) => {
                    const members = residentsMap.get(h.id) || []
                    return (
                      <tr
                        key={h.id}
                        className="cursor-pointer border-b even:bg-muted/20 motion-fade-in motion-slide-up hover:bg-muted/30"
                        style={{ '--stagger-index': i } as React.CSSProperties}
                        onClick={() => setFlyoutHousehold(h)}
                      >
                        <td className="px-4 py-3 sm:px-6 text-sm font-medium text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <ChevronRight className="size-3.5 text-muted-foreground" />
                            {h.household_number}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">{h.purok}</td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">{h.head_name}</td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-muted-foreground">{members.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredHouseholds.length === 0 && households.length > 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No households match your search.</p>
                </div>
              )}
              <Pagination page={page} totalPages={totalPages} totalItems={filteredHouseholds.length} onPageChange={setPage} pageSize={PAGE_SIZE} />
            </div>
          )}
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Household' : 'New Household'}</h2>
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
                <Label htmlFor="panel-household-number">Household Number *</Label>
                <Input id="panel-household-number" value={form.household_number} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-purok">Purok</Label>
                <Select id="panel-purok" value={form.purok} onValueChange={(v) => updateField('purok', v)}>
                  <option value="">Select purok</option>
                  {purokOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Head Name *</Label>
                <ResidentCombobox value={form.head_name} onChange={(v) => updateField('head_name', v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-address">Address</Label>
                <textarea
                  id="panel-address"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-notes">Notes</Label>
                <textarea
                  id="panel-notes"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
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
        open={flyoutHousehold !== null}
        onClose={closeFlyout}
        title={flyoutHousehold ? `Household #${flyoutHousehold.household_number}` : ''}
        onEdit={canModify && flyoutHousehold ? () => { openEditPanel(flyoutHousehold); closeFlyout() } : undefined}
        onDelete={canModify && flyoutHousehold ? () => handleDelete(flyoutHousehold.id) : undefined}
      >
        {flyoutHousehold && (() => {
          const members = residentsMap.get(flyoutHousehold.id) || []
          return (
            <>
              <DetailSection icon={<Home className="size-3" />} title="Household Info">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Household #:</span> <span className="font-medium">{flyoutHousehold.household_number}</span></div>
                  <div><span className="text-muted-foreground">Purok:</span> {flyoutHousehold.purok || '—'}</div>
                  <div><span className="text-muted-foreground">Head:</span> {flyoutHousehold.head_name}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {flyoutHousehold.address || '—'}</div>
                </div>
              </DetailSection>

              <DetailSection icon={<Users className="size-3" />} title={`Members (${members.length})`}>
                {members.length === 0 ? (
                  <p className="text-muted-foreground">No members.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">{m.first_name} {m.last_name}</span>
                        <span className="text-muted-foreground">({calculateAge(m.birth_date)} yrs)</span>
                        <div className="flex gap-1 flex-wrap">
                          {tagKeys.map((tag) =>
                            (m as Record<string, unknown>)[tag] ? (
                              <span key={tag} className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', tagColors[tag])}>
                                {tagLabels[tag]}
                              </span>
                            ) : null,
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DetailSection>

              {flyoutHousehold.notes && (
                <DetailSection title="Notes">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flyoutHousehold.notes}</p>
                </DetailSection>
              )}

              <DetailSection title="Metadata">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Created: {formatDateTime(flyoutHousehold.created)}</div>
                  <div>Updated: {formatDateTime(flyoutHousehold.updated)}</div>
                </div>
              </DetailSection>
            </>
          )
        })()}
      </DetailPanel>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete household"
        message="This action cannot be undone. The household record will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
