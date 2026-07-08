import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronDown, Search, Home, FileText, BookOpen, Activity, User } from 'lucide-react'
import { getResidents, createResident, updateResident, deleteResident, type ApiResident } from '@/api/residents'
import { searchHouseholds, getHousehold, type ApiHousehold } from '@/api/households'
import { getDocuments, type ApiDocument } from '@/api/documents'
import { getBlotters, type ApiBlotter } from '@/api/blotter'
import { getActivities, type ApiActivity } from '@/api/activity'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { hasRole } from '@/auth/session'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { tagColors } from '@/lib/statusStyles'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'

function statusClass(value: string, type: 'document' | 'blotter' | 'activity'): string {
  if (type === 'document') {
    if (value === 'released') return 'bg-muted text-muted-foreground'
    if (value === 'cancelled') return 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30'
    if (value === 'for_release') return 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30'
    if (value === 'processing') return 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30'
    return 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30'
  }
  if (type === 'blotter') {
    if (value === 'settled') return 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30'
    if (value === 'hearing') return 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30'
    if (value === 'dismissed') return 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30'
    if (value === 'escalated') return 'bg-orange-200 text-orange-900 border border-orange-400 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800/30'
    return 'bg-amber-200 text-amber-900 border border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/30'
  }
  if (value === 'create') return 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30'
  if (value === 'update') return 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30'
  return 'bg-red-200 text-red-900 border border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/30'
}

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

const tagKeys = ['is_voter', 'is_4ps', 'is_senior', 'is_pwd', 'is_deceased'] as const
const tagLabels: Record<string, string> = {
  is_voter: 'Voter',
  is_4ps: '4Ps',
  is_senior: 'Senior',
  is_pwd: 'PWD',
  is_deceased: 'Deceased',
}


function emptyForm() {
  return {
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    birth_date: '',
    gender: '',
    contact_number: '',
    household_id: '',
    purok: '',
    civil_status: '',
    occupation: '',
    nationality: 'Filipino',
    is_voter: false,
    is_4ps: false,
    is_senior: false,
    is_pwd: false,
    is_deceased: false,
    blood_type: '',
    notes: '',
  }
}

function HouseholdCombobox({ value, onChange }: { value: string; onChange: (id: string | null) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ApiHousehold[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ApiHousehold | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      getHousehold(value)
        .then(setSelected)
        .catch(() => setSelected(null))
    } else {
      setSelected(null)
    }
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!query || selected) { setResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const data = await searchHouseholds(query)
        setResults(data)
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, selected])

  function handleSelect(h: ApiHousehold) {
    setSelected(h)
    onChange(h.id)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    onChange(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const displayValue = selected ? `${selected.head_name} (${selected.household_number})` : query

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id="panel-household"
          value={displayValue}
          onChange={(e) => {
            setSelected(null)
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name, household #, or address..."
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-lg text-muted-foreground hover:text-foreground leading-none"
            aria-label="Clear household"
          >
            ×
          </button>
        )}
      </div>
      {open && results.length > 0 && query && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
          {results.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => handleSelect(h)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className="font-medium">{h.head_name}</span>
              <span className="text-muted-foreground">({h.household_number})</span>
              {h.address && <span className="ml-auto truncate text-xs text-muted-foreground">{h.address}</span>}
            </button>
          ))}
        </div>
      )}
      {open && !selected && query && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background p-2 text-sm text-muted-foreground shadow-lg">
          No households found
        </div>
      )}
    </div>
  )
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  useBodyScrollLock(panelOpen)
  const [error, setError] = useState<string | null>(null)
  const [age, setAge] = useState(0)
  const [flyoutResident, setFlyoutResident] = useState<ApiResident | null>(null)
  const [flyoutHousehold, setFlyoutHousehold] = useState<ApiHousehold | null>(null)
  const [flyoutDocs, setFlyoutDocs] = useState<ApiDocument[]>([])
  const [flyoutBlotters, setFlyoutBlotters] = useState<ApiBlotter[]>([])
  const [flyoutActivities, setFlyoutActivities] = useState<ApiActivity[]>([])
  const [flyoutLoading, setFlyoutLoading] = useState(false)
  useEffect(() => {
    getResidents()
      .then(setResidents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load residents'))
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && residents.length > 0) {
      const record = residents.find(r => r.id === selectedId)
      if (record) {
        openFlyout(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, residents])

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim()) return

    try {
      const payload = { ...form, age: calculateAge(form.birth_date) }
      for (const key of ['household_id', 'gender', 'civil_status', 'blood_type', 'suffix', 'middle_name', 'contact_number', 'occupation', 'nationality', 'notes'] as const) {
        if (payload[key] === '') (payload as Record<string, unknown>)[key] = null
      }
      if (editingId) {
        const updated = await updateResident(editingId, payload)
        setResidents((prev) =>
          prev.map((r) => (r.id === editingId ? updated : r)),
        )
      } else {
        const created = await createResident(payload)
        setResidents((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resident')
    }
  }

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setAge(0)
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiResident) {
    setEditingId(record.id)
    setForm({
      first_name: record.first_name,
      last_name: record.last_name,
      middle_name: record.middle_name,
      suffix: record.suffix,
      birth_date: record.birth_date,
      gender: record.gender,
      contact_number: record.contact_number,
      household_id: record.household_id,
      purok: record.purok,
      civil_status: record.civil_status,
      occupation: record.occupation,
      nationality: record.nationality,
      is_voter: record.is_voter,
      is_4ps: record.is_4ps,
      is_senior: record.is_senior,
      is_pwd: record.is_pwd,
      is_deceased: record.is_deceased,
      blood_type: record.blood_type,
      notes: record.notes,
    })
    setAge(calculateAge(record.birth_date))
    setPanelOpen(true)
    setError(null)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteResident(deletingId)
      setResidents((prev) => prev.filter((r) => r.id !== deletingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resident')
    } finally {
      setDeletingId(null)
    }
  }

  function openFlyout(r: ApiResident) {
    setFlyoutResident(r)
    setFlyoutLoading(true)
    setFlyoutHousehold(null)
    setFlyoutDocs([])
    setFlyoutBlotters([])
    setFlyoutActivities([])
    Promise.all([
      r.household_id ? getHousehold(r.household_id).catch(() => null) : Promise.resolve(null),
      getDocuments(),
      getBlotters(),
      getActivities(1, 50, '-id', undefined, r.id),
    ]).then(([household, docs, blotters, acts]) => {
      setFlyoutHousehold(household as ApiHousehold | null)
      setFlyoutDocs((docs as ApiDocument[]).filter((d) => d.resident_name && r.first_name && d.resident_name.includes(r.first_name)))
      setFlyoutBlotters((blotters as ApiBlotter[]).filter((b) =>
        (b.complainant_name && r.first_name && b.complainant_name.includes(r.first_name)) ||
        (b.respondent_name && r.first_name && b.respondent_name.includes(r.first_name)),
      ))
      setFlyoutActivities(acts.items)
    }).catch(() => {}).finally(() => setFlyoutLoading(false))
  }

  function closeFlyout() {
    setFlyoutResident(null)
    setFlyoutHousehold(null)
    setFlyoutDocs([])
    setFlyoutBlotters([])
    setFlyoutActivities([])
  }

  function closePanel() {
    setPanelOpen(false)
    setEditingId(null)
    setForm(emptyForm())
    setAge(0)
    setError(null)
  }

  const canModify = hasRole('admin', 'staff')

  const columns: Column<ApiResident>[] = [
    { key: 'last_name', label: 'Name', sortable: true, filterType: 'text',
      filterValue: (r) => `${r.last_name}, ${r.first_name}${r.middle_name ? ' ' + r.middle_name : ''}`,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="size-3" />
          </div>
          <span className="font-medium text-xs">{r.last_name}, {r.first_name}{r.middle_name ? ' ' + r.middle_name : ''}</span>
        </div>
      ) },
    { key: 'purok', label: 'Purok', sortable: true, filterType: 'select',
      filterOptions: purokOptions.map(p => ({ label: p, value: p })) },
    { key: 'gender', label: 'Gender', filterType: 'select',
      filterOptions: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
    { key: 'birth_date', label: 'Age',
      render: (r) => { if (r.birth_date) return calculateAge(r.birth_date).toString(); return '' } },
    { key: 'civil_status', label: 'Civil Status', filterType: 'select',
      filterOptions: [
        { label: 'Single', value: 'single' }, { label: 'Married', value: 'married' },
        { label: 'Widowed', value: 'widowed' }, { label: 'Separated', value: 'separated' },
      ] },
    { key: 'nationality', label: 'Nationality', filterType: 'text' },
    { key: 'tags', label: 'Tags', filterType: 'text',
      filterValue: (r) => tagKeys.filter((k) => (r as Record<string, unknown>)[k]).map((k) => tagLabels[k]).join(' '),
      render: (r) => (
        <div className="flex flex-wrap gap-0.5">
          {tagKeys.filter((k) => (r as Record<string, unknown>)[k]).map((k) => (
            <span key={k} className={cn('inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold', tagColors[k])}>
              {tagLabels[k]}
            </span>
          ))}
        </div>
      ) },
  ]

  const newResidentButton = canModify ? (
    <Button variant="ghost" size="sm" className="gap-0.5 rounded-md text-blue-400 hover:text-blue-300 h-6 text-xs" onClick={openCreatePanel}>
      <Plus className="size-3" />
      New Resident
    </Button>
  ) : null

  return (
    <>
      <div className="-ml-4 -mr-4 sm:-ml-6 sm:-mr-6 lg:-ml-8 lg:-mr-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-56px)] h-[calc(100dvh-60px)] md:h-[calc(100dvh-52px)] flex flex-col overflow-hidden">
        <DataTable
          title="RESIDENT PROFILES"
          toolbarActions={newResidentButton}
          columns={columns}
          data={residents}
          loading={loading}
          onRowClick={(r) => openFlyout(r)}
          emptyState={
            residents.length === 0
              ? <EmptyState title="No residents yet" description="Add your first resident." action={canModify ? { label: "Create first resident", onClick: openCreatePanel } : undefined} />
              : undefined
          }
          rowKey={(r) => r.id}
          toolbar
          exportable
          sortKey="last_name"
          sortDir="asc"
        />
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">{editingId ? 'Edit Resident' : 'New Resident'}</h2>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-first-name">First Name *</Label>
                  <Input id="panel-first-name" value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} required autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-last-name">Last Name *</Label>
                  <Input id="panel-last-name" value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-middle-name">Middle Name</Label>
                  <Input id="panel-middle-name" value={form.middle_name} onChange={(e) => updateField('middle_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-suffix">Suffix</Label>
                  <Select id="panel-suffix" value={form.suffix} onValueChange={(v) => updateField('suffix', v)}>
                    <option value="">Select suffix</option>
                    <option value="—">—</option>
                    <option value="Jr.">Jr.</option>
                    <option value="Sr.">Sr.</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-birth-date">Birth Date</Label>
                  <Input id="panel-birth-date" type="date" value={form.birth_date} onChange={(e) => { updateField('birth_date', e.target.value); setAge(calculateAge(e.target.value)) }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-age">Age</Label>
                  <Input id="panel-age" type="number" value={age || ''} disabled className="opacity-70" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-gender">Gender</Label>
                  <Select id="panel-gender" value={form.gender} onValueChange={(v) => updateField('gender', v)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-contact">Contact Number</Label>
                  <Input id="panel-contact" value={form.contact_number} onChange={(e) => updateField('contact_number', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <Label htmlFor="panel-civil-status">Civil Status</Label>
                  <Select id="panel-civil-status" value={form.civil_status} onValueChange={(v) => updateField('civil_status', v)}>
                    <option value="">Select status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Household</Label>
                  <HouseholdCombobox value={form.household_id} onChange={(id) => updateField('household_id', id ?? '')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-occupation">Occupation</Label>
                  <Input id="panel-occupation" value={form.occupation} onChange={(e) => updateField('occupation', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="panel-nationality">Nationality</Label>
                  <Input id="panel-nationality" value={form.nationality} onChange={(e) => updateField('nationality', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-blood-type">Blood Type</Label>
                  <Select id="panel-blood-type" value={form.blood_type} onValueChange={(v) => updateField('blood_type', v)}>
                    <option value="">Select type</option>
                    <option value="—">—</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tagKeys.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => updateField(tag, !(form as Record<string, unknown>)[tag])}
                      className={cn(
                        'rounded-md px-4 py-1 text-xs font-bold transition-colors',
                        (form as Record<string, unknown>)[tag]
                          ? tagColors[tag]
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      {tagLabels[tag]}
                    </button>
                  ))}
                </div>
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
        open={flyoutResident !== null}
        onClose={closeFlyout}
        title={flyoutResident ? `${flyoutResident.first_name} ${flyoutResident.last_name}` : ''}
        onEdit={canModify && flyoutResident ? () => { openEditPanel(flyoutResident!); closeFlyout() } : undefined}
        onDelete={canModify && flyoutResident ? () => handleDelete(flyoutResident!.id) : undefined}
        loading={flyoutLoading}
      >
        {flyoutResident && (
          <>
            <DetailSection icon={<Search className="size-3" />} title="Personal Information">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{flyoutResident!.first_name} {flyoutResident!.last_name}</span></div>
            <div><span className="text-muted-foreground">Middle Name:</span> {flyoutResident!.middle_name || '—'}</div>
            <div><span className="text-muted-foreground">Suffix:</span> {flyoutResident!.suffix || '—'}</div>
            <div><span className="text-muted-foreground">Age:</span> {flyoutResident!.birth_date ? calculateAge(flyoutResident!.birth_date) : '—'}</div>
            <div><span className="text-muted-foreground">Gender:</span> {flyoutResident!.gender ? (flyoutResident!.gender.charAt(0).toUpperCase() + flyoutResident!.gender.slice(1)) : '—'}</div>
            <div><span className="text-muted-foreground">Birth Date:</span> {formatDate(flyoutResident!.birth_date)}</div>
            <div><span className="text-muted-foreground">Contact:</span> {flyoutResident!.contact_number || '—'}</div>
            <div><span className="text-muted-foreground">Civil Status:</span> {flyoutResident!.civil_status ? (flyoutResident!.civil_status.charAt(0).toUpperCase() + flyoutResident!.civil_status.slice(1)) : '—'}</div>
            <div><span className="text-muted-foreground">Purok:</span> {flyoutResident!.purok || '—'}</div>
            <div><span className="text-muted-foreground">Occupation:</span> {flyoutResident!.occupation || '—'}</div>
            <div><span className="text-muted-foreground">Nationality:</span> {flyoutResident!.nationality || '—'}</div>
            <div><span className="text-muted-foreground">Blood Type:</span> {flyoutResident!.blood_type || '—'}</div>
            <div className="col-span-2 flex gap-1 flex-wrap">
              {tagKeys.map((tag) =>
                (flyoutResident as Record<string, unknown>)[tag] ? (
                  <span key={tag} className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', tagColors[tag])}>
                    {tagLabels[tag]}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        </DetailSection>

        <DetailSection icon={<Home className="size-3" />} title="Household">
          {flyoutHousehold ? (
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Household #:</span> {flyoutHousehold.household_number}</div>
              <div><span className="text-muted-foreground">Head:</span> {flyoutHousehold.head_name}</div>
              <div><span className="text-muted-foreground">Purok:</span> {flyoutHousehold.purok || '—'}</div>
              <div><span className="text-muted-foreground">Address:</span> {flyoutHousehold.address || '—'}</div>
            </div>
          ) : (
            <p className="text-muted-foreground">Not assigned to a household.</p>
          )}
        </DetailSection>

        <DetailSection icon={<FileText className="size-3" />} title="Document Requests">
          {flyoutDocs.length === 0 ? (
            <p className="text-muted-foreground">No document requests found.</p>
          ) : (
            <div className="space-y-1.5">
              {flyoutDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="font-medium shrink-0">#{d.queue_number}</span>
                  <span className="capitalize text-muted-foreground flex-1 truncate">{d.document_type.replace(/_/g, ' ')}</span>
                  <span className={cn('inline-flex shrink-0 rounded-md px-3 py-0.5 text-xs font-bold', statusClass(d.status, 'document'))}>{d.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        <DetailSection icon={<BookOpen className="size-3" />} title="Blotter Records">
          {flyoutBlotters.length === 0 ? (
            <p className="text-muted-foreground">No blotter records found.</p>
          ) : (
            <div className="space-y-1.5">
              {flyoutBlotters.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="font-medium shrink-0">{b.case_number}</span>
                  <span className="text-muted-foreground flex-1 truncate">{b.complainant_name} vs {b.respondent_name || '—'}</span>
                  <span className={cn('inline-flex shrink-0 rounded-md px-3 py-0.5 text-xs font-bold', statusClass(b.status, 'blotter'))}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        <DetailSection icon={<Activity className="size-3" />} title="Activity History">
          {flyoutActivities.length === 0 ? (
            <p className="text-muted-foreground">No activity history found.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {flyoutActivities.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm gap-2">
                  <span className={cn('inline-flex shrink-0 rounded-md px-3 py-0.5 text-xs font-bold', statusClass(a.action, 'activity'))}>{a.action}</span>
                  <span className="flex-1 px-2 text-muted-foreground truncate">{a.details}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(a.created)}</span>
                </div>
              ))}
            </div>
          )}
        </DetailSection>
          </>
        )}
      </DetailPanel>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete resident"
        message="This action cannot be undone. The resident profile and all associated data will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
