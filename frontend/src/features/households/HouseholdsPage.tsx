import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronDown, Home, Users, MapPin, Building2, ArrowUpDown } from 'lucide-react'
import {
  getHouseholds,
  getNextHouseholdNumber,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  type ApiHousehold,
} from '@/api/households'
import {
  getHouseholdMembers,
  createHouseholdMember,
  deleteHouseholdMember,
  type ApiHouseholdMember,
} from '@/api/householdMembers'
import {
  getMigrants,
  createMigrant,
  deleteMigrant,
  type ApiMigrant,
} from '@/api/migrantInfo'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { hasRole } from '@/auth/session'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { useLookups } from '@/hooks/useLookups'

/* ------------------------------------------------------------------ */
/*  Order-listing sort (PSA household member ordering)                 */
/* ------------------------------------------------------------------ */

const ORDER_LABELS: Record<string, number> = {
  '1': 1, '2a': 2, '2b': 3, '3': 4, '4': 5, '5': 6, '6': 7,
  '7': 8, '8': 9, '9': 10, '10': 11, '11': 12, '12': 13, '13': 14,
  '14': 15, '15': 16, '16': 17, '17': 18, '18': 19, '19': 20, '20': 21,
  '21': 22, '22': 23, '23': 24, '24': 25, '25': 26, '26': 27,
}

function sortMembers<T extends { relationship_to_head: string; sort_order?: number }>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    const oa = ORDER_LABELS[a.relationship_to_head] ?? 99
    const ob = ORDER_LABELS[b.relationship_to_head] ?? 99
    if (oa !== ob) return oa - ob
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })
}

/* ------------------------------------------------------------------ */
/*  Empty form factories                                               */
/* ------------------------------------------------------------------ */

function emptyForm() {
  return {
    household_number: '',
    region: '',
    province: '',
    city_municipality: '',
    barangay: '',
    sitio_purok: '',
    household_complete_address: '',
    no_of_families: 0,
    no_of_household_members: 0,
    no_of_migrants: 0,
    household_type: '',
    household_type_other: '',
    tenure_status: '',
    tenure_status_other: '',
    household_unit: '',
    household_unit_other: '',
    household_name: '',
    monthly_income: 0,
  }
}

function emptyMemberForm() {
  return {
    first_name: '',
    last_name: '',
    middle_name: '',
    ext_name: '',
    relationship_to_head: '',
    source_of_income: '',
    monthly_income: 0,
  }
}

function emptyMigrantForm() {
  return {
    first_name: '',
    last_name: '',
    middle_name: '',
    ext_name: '',
    previous_residence: '',
    length_of_stay_previous_barangay: '',
    reason_for_leaving: '',
    reason_for_leaving_other: '',
    date_of_transfer: '',
    reason_for_transferring: '',
    reason_for_transferring_other: '',
    duration_of_stay_current_barangay: '',
    intention_to_return: false,
  }
}

/* ------------------------------------------------------------------ */
/*  Helper: convert LookupOption[] to ComboboxOption[]                 */
/* ------------------------------------------------------------------ */

function toComboboxOptions(opts: { label: string; code?: string }[]): ComboboxOption[] {
  return opts.map((o) => ({ label: o.label, value: o.code ?? o.label }))
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HouseholdsPage() {
  /* ── state ─────────────────────────────────────────────────────── */

  const [households, setHouseholds] = useState<ApiHousehold[]>([])
  const [loading, setLoading] = useState(true)

  // Detail panel (flyout)
  const [flyoutHousehold, setFlyoutHousehold] = useState<ApiHousehold | null>(null)
  const [flyoutMembers, setFlyoutMembers] = useState<ApiHouseholdMember[]>([])
  const [flyoutMigrants, setFlyoutMigrants] = useState<ApiMigrant[]>([])
  const [flyoutLoading, setFlyoutLoading] = useState(false)

  // Create / Edit panel
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMembers, setPanelMembers] = useState<ApiHouseholdMember[]>([])
  const [panelMigrants, setPanelMigrants] = useState<ApiMigrant[]>([])
  useBodyScrollLock(panelOpen)

  // Inline add-member form
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberForm, setMemberForm] = useState(emptyMemberForm())

  // Inline add-migrant form
  const [showAddMigrant, setShowAddMigrant] = useState(false)
  const [migrantForm, setMigrantForm] = useState(emptyMigrantForm())

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // General error
  const [error, setError] = useState<string | null>(null)

  // ── Lookups ──────────────────────────────────────────────────────

  const { data: householdTypeOptions } = useLookups('household_type')
  const { data: tenureStatusOptions } = useLookups('tenure_status')
  const { data: householdUnitOptions } = useLookups('household_unit')
  const { data: relationshipOptions } = useLookups('relationship_to_head')
  const { data: incomeOptions } = useLookups('source_of_income')
  const { data: reasonLeavingOptions } = useLookups('reason_for_leaving')
  const { data: reasonTransferringOptions } = useLookups('reason_for_transferring')

  const relationshipComboboxOptions = useMemo(
    () => toComboboxOptions(relationshipOptions),
    [relationshipOptions],
  )
  const reasonLeavingComboboxOptions = useMemo(
    () => toComboboxOptions(reasonLeavingOptions),
    [reasonLeavingOptions],
  )

  // Label map helpers for display
  const relationshipLabelMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const opt of relationshipOptions) m.set(opt.code ?? opt.label, opt.label)
    return m
  }, [relationshipOptions])

  const incomeLabelMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const opt of incomeOptions) m.set(opt.code ?? opt.label, opt.label)
    return m
  }, [incomeOptions])

  const leavingLabelMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const opt of reasonLeavingOptions) m.set(opt.code ?? opt.label, opt.label)
    return m
  }, [reasonLeavingOptions])

  const transferLabelMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const opt of reasonTransferringOptions) m.set(opt.code ?? opt.label, opt.label)
    return m
  }, [reasonTransferringOptions])

  /* ── data loading ──────────────────────────────────────────────── */

  useEffect(() => {
    getHouseholds()
      .then(setHouseholds)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load households'))
      .finally(() => setLoading(false))
  }, [])

  // URL deep-link
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && households.length > 0) {
      const record = households.find((h) => h.id === selectedId)
      if (record) setFlyoutHousehold(record)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, households])

  // Fetch members/migrants when flyout opens
  useEffect(() => {
    if (!flyoutHousehold) {
      setFlyoutMembers([])
      setFlyoutMigrants([])
      return
    }
    setFlyoutLoading(true)
    Promise.all([getHouseholdMembers(flyoutHousehold.id), getMigrants(flyoutHousehold.id)])
      .then(([members, migrants]) => {
        setFlyoutMembers(sortMembers(members))
        setFlyoutMigrants(migrants)
      })
      .catch(() => {})
      .finally(() => setFlyoutLoading(false))
  }, [flyoutHousehold])

  /* ── form helpers ──────────────────────────────────────────────── */

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateNumberField(field: string, value: string) {
    const num = value === '' ? 0 : Number(value)
    setForm((prev) => ({ ...prev, [field]: num }))
  }

  /* ── panel handlers ────────────────────────────────────────────── */

  function closePanel() {
    setPanelOpen(false)
    setEditingId(null)
    setForm(emptyForm())
    setPanelMembers([])
    setPanelMigrants([])
    setShowAddMember(false)
    setMemberForm(emptyMemberForm())
    setShowAddMigrant(false)
    setMigrantForm(emptyMigrantForm())
    setError(null)
  }

  async function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    const num = await getNextHouseholdNumber()
    setForm((prev) => ({ ...prev, household_number: num }))
    setPanelMembers([])
    setPanelMigrants([])
    setPanelOpen(true)
  }

  function openEditPanel(household: ApiHousehold) {
    setEditingId(household.id)
    setForm({
      household_number: household.household_number,
      region: household.region ?? '',
      province: household.province ?? '',
      city_municipality: household.city_municipality ?? '',
      barangay: household.barangay ?? '',
      sitio_purok: household.sitio_purok ?? '',
      household_complete_address: household.household_complete_address || household.address || '',
      no_of_families: household.no_of_families ?? 0,
      no_of_household_members: household.no_of_household_members ?? 0,
      no_of_migrants: household.no_of_migrants ?? 0,
      household_type: household.household_type ?? '',
      household_type_other: household.household_type_other ?? '',
      tenure_status: household.tenure_status ?? '',
      tenure_status_other: household.tenure_status_other ?? '',
      household_unit: household.household_unit ?? '',
      household_unit_other: household.household_unit_other ?? '',
      household_name: household.household_name ?? '',
      monthly_income: household.monthly_income ?? 0,
    })
    setPanelOpen(true)
    setError(null)

    // Fetch existing members & migrants
    Promise.all([getHouseholdMembers(household.id), getMigrants(household.id)])
      .then(([members, migrants]) => {
        setPanelMembers(sortMembers(members))
        setPanelMigrants(migrants)
      })
      .catch(() => {
        setPanelMembers([])
        setPanelMigrants([])
      })
  }

  /* ── submit ────────────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.household_number.trim()) return

    try {
      if (editingId) {
        const updated = await updateHousehold(editingId, form)
        setHouseholds((prev) => prev.map((h) => (h.id === editingId ? updated : h)))
      } else {
        const created = await createHousehold(form)
        setHouseholds((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save household')
    }
  }

  /* ── member handlers ───────────────────────────────────────────── */

  async function handleAddMember() {
    if (!memberForm.first_name.trim() || !memberForm.last_name.trim() || !memberForm.relationship_to_head) return
    if (!editingId) return

    try {
      const created = await createHouseholdMember({
        household_id: editingId,
        first_name: memberForm.first_name.trim(),
        last_name: memberForm.last_name.trim(),
        middle_name: memberForm.middle_name.trim() || undefined,
        ext_name: memberForm.ext_name.trim() || undefined,
        relationship_to_head: memberForm.relationship_to_head,
        source_of_income: memberForm.source_of_income || undefined,
        monthly_income: memberForm.monthly_income || 0,
      })
      setPanelMembers((prev) => sortMembers([...prev, created]))
      setMemberForm(emptyMemberForm())
      setShowAddMember(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    }
  }

  async function handleDeleteMember(id: string) {
    try {
      await deleteHouseholdMember(id)
      setPanelMembers((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  /* ── migrant handlers ──────────────────────────────────────────── */

  async function handleAddMigrant() {
    if (
      !migrantForm.first_name.trim() ||
      !migrantForm.last_name.trim() ||
      !migrantForm.previous_residence ||
      !migrantForm.date_of_transfer
    ) return
    if (!editingId) return

    try {
      const created = await createMigrant({
        household_id: editingId,
        first_name: migrantForm.first_name.trim(),
        last_name: migrantForm.last_name.trim(),
        middle_name: migrantForm.middle_name.trim() || undefined,
        ext_name: migrantForm.ext_name.trim() || undefined,
        previous_residence: migrantForm.previous_residence,
        length_of_stay_previous_barangay: migrantForm.length_of_stay_previous_barangay,
        reason_for_leaving: migrantForm.reason_for_leaving,
        reason_for_leaving_other: migrantForm.reason_for_leaving === '16' ? migrantForm.reason_for_leaving_other : undefined,
        date_of_transfer: migrantForm.date_of_transfer,
        reason_for_transferring: migrantForm.reason_for_transferring,
        reason_for_transferring_other: migrantForm.reason_for_transferring === '5' ? migrantForm.reason_for_transferring_other : undefined,
        duration_of_stay_current_barangay: migrantForm.duration_of_stay_current_barangay,
        intention_to_return: migrantForm.intention_to_return,
      })
      setPanelMigrants((prev) => [...prev, created])
      setMigrantForm(emptyMigrantForm())
      setShowAddMigrant(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add migrant')
    }
  }

  async function handleDeleteMigrant(id: string) {
    try {
      await deleteMigrant(id)
      setPanelMigrants((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove migrant')
    }
  }

  /* ── delete household ──────────────────────────────────────────── */

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

  /* ── flyout ────────────────────────────────────────────────────── */

  function closeFlyout() {
    setFlyoutHousehold(null)
  }

  /* ── misc ──────────────────────────────────────────────────────── */

  const canModify = hasRole('admin', 'staff')

  const newHouseholdButton = canModify ? (
    <Button variant="ghost" size="sm" className="gap-0.5 rounded-md text-blue-400 hover:text-blue-300 h-6 text-xs" onClick={openCreatePanel}>
      <Plus className="size-3" />
      New Household
    </Button>
  ) : null

  /* ── columns ───────────────────────────────────────────────────── */

  const columns: Column<ApiHousehold>[] = [
    {
      key: 'household_number',
      label: 'Household #',
      sortable: true,
      filterType: 'text',
    },
    {
      key: 'household_name',
      label: 'Name',
      filterType: 'text',
      render: (h) => (
        <div className="flex items-center gap-1.5">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Home className="size-3" />
          </div>
          <span className="font-medium text-xs">{h.household_name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'sitio_purok',
      label: 'Sitio / Purok',
      sortable: true,
      filterType: 'text',
      render: (h) => h.sitio_purok || '—',
    },
    {
      key: 'household_type',
      label: 'Type',
      filterType: 'text',
      render: (h) => h.household_type || '—',
    },
    {
      key: 'member_count',
      label: 'Members',
      render: (h) => (h.no_of_household_members ?? 0).toString(),
    },
  ]

  /* ── render ────────────────────────────────────────────────────── */

  return (
    <>
      {/* ── data table ──────────────────────────────────────────── */}
      <div className="-ml-4 -mr-4 sm:-ml-6 sm:-mr-6 lg:-ml-8 lg:-mr-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 h-[calc(100vh-56px)] h-[calc(100dvh-60px)] md:h-[calc(100dvh-52px)] flex flex-col overflow-hidden">
        <DataTable
          title="HOUSEHOLDS"
          toolbarActions={newHouseholdButton}
          columns={columns}
          data={households}
          loading={loading}
          onRowClick={(h) => setFlyoutHousehold(h)}
          emptyState={
            households.length === 0
              ? <EmptyState title="No households yet" description="Create your first household." action={canModify ? { label: 'Create first household', onClick: openCreatePanel } : undefined} />
              : undefined
          }
          rowKey={(h) => h.id}
          toolbar
          exportable
        />
      </div>

      {/* ── create / edit panel ─────────────────────────────────── */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">{editingId ? 'Edit Household' : 'New Household'}</h2>
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

              {/* Household number (auto-generated, read-only) */}
              <div className="space-y-2">
                <Label htmlFor="panel-household-number">Household Number *</Label>
                <Input id="panel-household-number" value={form.household_number} disabled className="bg-muted" />
              </div>

              {/* ── Address section ──────────────────────────────── */}
              <div className="space-y-3 border-b border-border pb-4">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin className="size-3" />
                  Address
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="panel-region" className="text-xs">Region *</Label>
                    <Input id="panel-region" value={form.region} onChange={(e) => updateField('region', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-province" className="text-xs">Province *</Label>
                    <Input id="panel-province" value={form.province} onChange={(e) => updateField('province', e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="panel-city" className="text-xs">City / Municipality *</Label>
                    <Input id="panel-city" value={form.city_municipality} onChange={(e) => updateField('city_municipality', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-barangay" className="text-xs">Barangay *</Label>
                    <Input id="panel-barangay" value={form.barangay} onChange={(e) => updateField('barangay', e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-sitio-purok" className="text-xs">Sitio / Purok</Label>
                  <Input id="panel-sitio-purok" value={form.sitio_purok} onChange={(e) => updateField('sitio_purok', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-address" className="text-xs">Household Complete Address *</Label>
                  <textarea
                    id="panel-address"
                    value={form.household_complete_address}
                    onChange={(e) => updateField('household_complete_address', e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* ── Classification section ────────────────────────── */}
              <div className="space-y-3 border-b border-border pb-4">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="size-3" />
                  Classification
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="panel-household-type" className="text-xs">Household Type *</Label>
                  <Select id="panel-household-type" value={form.household_type} onValueChange={(v) => updateField('household_type', v)} className="h-8 text-xs">
                    <option value="">Select type</option>
                    {householdTypeOptions.map((opt) => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                {form.household_type === 'Others' && (
                  <div className="space-y-2">
                    <Label htmlFor="panel-hh-type-other" className="text-xs">Specify household type *</Label>
                    <Input id="panel-hh-type-other" value={form.household_type_other} onChange={(e) => updateField('household_type_other', e.target.value)} className="h-8 text-xs" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="panel-tenure-status" className="text-xs">Tenure Status *</Label>
                  <Select id="panel-tenure-status" value={form.tenure_status} onValueChange={(v) => updateField('tenure_status', v)} className="h-8 text-xs">
                    <option value="">Select tenure</option>
                    {tenureStatusOptions.map((opt) => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                {form.tenure_status === 'Others' && (
                  <div className="space-y-2">
                    <Label htmlFor="panel-tenure-other" className="text-xs">Specify tenure status *</Label>
                    <Input id="panel-tenure-other" value={form.tenure_status_other} onChange={(e) => updateField('tenure_status_other', e.target.value)} className="h-8 text-xs" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="panel-household-unit" className="text-xs">Household Unit *</Label>
                  <Select id="panel-household-unit" value={form.household_unit} onValueChange={(v) => updateField('household_unit', v)} className="h-8 text-xs">
                    <option value="">Select unit</option>
                    {householdUnitOptions.map((opt) => (
                      <option key={opt.label} value={opt.label}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                {form.household_unit === 'Others' && (
                  <div className="space-y-2">
                    <Label htmlFor="panel-unit-other" className="text-xs">Specify household unit *</Label>
                    <Input id="panel-unit-other" value={form.household_unit_other} onChange={(e) => updateField('household_unit_other', e.target.value)} className="h-8 text-xs" />
                  </div>
                )}
              </div>

              {/* ── Demographics section ──────────────────────────── */}
              <div className="space-y-3 border-b border-border pb-4">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Users className="size-3" />
                  Demographics
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="panel-no-families" className="text-xs">No. of Families</Label>
                    <Input id="panel-no-families" type="number" min={0} value={form.no_of_families} onChange={(e) => updateNumberField('no_of_families', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-no-members" className="text-xs">No. of Members</Label>
                    <Input id="panel-no-members" type="number" min={0} value={form.no_of_household_members} onChange={(e) => updateNumberField('no_of_household_members', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-no-migrants" className="text-xs">No. of Migrants</Label>
                    <Input id="panel-no-migrants" type="number" min={0} value={form.no_of_migrants} onChange={(e) => updateNumberField('no_of_migrants', e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-household-name" className="text-xs">Household Name</Label>
                  <Input id="panel-household-name" value={form.household_name} onChange={(e) => updateField('household_name', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-monthly-income" className="text-xs">Monthly Income</Label>
                  <Input id="panel-monthly-income" type="number" min={0} value={form.monthly_income} onChange={(e) => updateNumberField('monthly_income', e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              {/* ── Members section (edit only) ──────────────────── */}
              {editingId && (
                <div className="space-y-3 border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Users className="size-3" />
                      Household Members ({panelMembers.length})
                    </h3>
                    {!showAddMember && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddMember(true)} className="h-7 gap-1 text-xs">
                        <Plus className="size-3" />
                        Add Member
                      </Button>
                    )}
                  </div>

                  {/* Inline add-member form */}
                  {showAddMember && (
                    <div className="space-y-3 rounded-md border border-border/50 bg-muted/30 p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">First Name *</Label>
                          <Input value={memberForm.first_name} onChange={(e) => setMemberForm((p) => ({ ...p, first_name: e.target.value }))} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Last Name *</Label>
                          <Input value={memberForm.last_name} onChange={(e) => setMemberForm((p) => ({ ...p, last_name: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Middle Name</Label>
                          <Input value={memberForm.middle_name} onChange={(e) => setMemberForm((p) => ({ ...p, middle_name: e.target.value }))} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Ext. Name</Label>
                          <Input value={memberForm.ext_name} onChange={(e) => setMemberForm((p) => ({ ...p, ext_name: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Relationship to Head *</Label>
                        <Combobox
                          options={relationshipComboboxOptions}
                          value={memberForm.relationship_to_head}
                          onChange={(v) => setMemberForm((p) => ({ ...p, relationship_to_head: v }))}
                          placeholder="Search relationship..."
                          className="[&_input]:h-8 [&_input]:text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Source of Income</Label>
                          <Select value={memberForm.source_of_income} onValueChange={(v) => setMemberForm((p) => ({ ...p, source_of_income: v }))} className="h-8 text-xs">
                            <option value="">Select</option>
                            {incomeOptions.map((opt) => (
                              <option key={opt.code ?? opt.label} value={opt.code ?? opt.label}>{opt.label}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Monthly Income</Label>
                          <Input type="number" min={0} value={memberForm.monthly_income} onChange={(e) => setMemberForm((p) => ({ ...p, monthly_income: e.target.value === '' ? 0 : Number(e.target.value) }))} className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleAddMember} className="h-7 text-xs">Add</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddMember(false); setMemberForm(emptyMemberForm()) }} className="h-7 text-xs">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Existing members list */}
                  {panelMembers.length > 0 && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {panelMembers.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-1 rounded border border-border/50 p-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-foreground">{m.last_name}, {m.first_name}</span>
                            {m.middle_name && <span className="text-muted-foreground"> {m.middle_name}</span>}
                            {m.ext_name && <span className="text-muted-foreground"> {m.ext_name}</span>}
                            <span className="ml-2 text-muted-foreground">
                              {relationshipLabelMap.get(m.relationship_to_head) ?? m.relationship_to_head}
                            </span>
                          </div>
                          <button type="button" onClick={() => handleDeleteMember(m.id)} className="shrink-0 text-destructive hover:text-destructive/80" aria-label="Remove member">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Migrant section (edit only, conditional) ─────── */}
              {editingId && form.no_of_migrants > 0 && (
                <div className="space-y-3 border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <ArrowUpDown className="size-3" />
                      Migrant Info ({panelMigrants.length})
                    </h3>
                    {!showAddMigrant && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddMigrant(true)} className="h-7 gap-1 text-xs">
                        <Plus className="size-3" />
                        Add Migrant
                      </Button>
                    )}
                  </div>

                  {/* Inline add-migrant form */}
                  {showAddMigrant && (
                    <div className="space-y-3 rounded-md border border-border/50 bg-muted/30 p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">First Name *</Label>
                          <Input value={migrantForm.first_name} onChange={(e) => setMigrantForm((p) => ({ ...p, first_name: e.target.value }))} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Last Name *</Label>
                          <Input value={migrantForm.last_name} onChange={(e) => setMigrantForm((p) => ({ ...p, last_name: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Middle Name</Label>
                          <Input value={migrantForm.middle_name} onChange={(e) => setMigrantForm((p) => ({ ...p, middle_name: e.target.value }))} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Ext. Name</Label>
                          <Input value={migrantForm.ext_name} onChange={(e) => setMigrantForm((p) => ({ ...p, ext_name: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Previous Residence *</Label>
                        <Input value={migrantForm.previous_residence} onChange={(e) => setMigrantForm((p) => ({ ...p, previous_residence: e.target.value }))} className="h-8 text-xs" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Length of Stay (prev. barangay) *</Label>
                          <Input value={migrantForm.length_of_stay_previous_barangay} onChange={(e) => setMigrantForm((p) => ({ ...p, length_of_stay_previous_barangay: e.target.value }))} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Date of Transfer *</Label>
                          <Input type="date" value={migrantForm.date_of_transfer} onChange={(e) => setMigrantForm((p) => ({ ...p, date_of_transfer: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Reason for Leaving *</Label>
                        <Combobox
                          options={reasonLeavingComboboxOptions}
                          value={migrantForm.reason_for_leaving}
                          onChange={(v) => setMigrantForm((p) => ({ ...p, reason_for_leaving: v }))}
                          placeholder="Search reason..."
                          className="[&_input]:h-8 [&_input]:text-xs"
                        />
                      </div>
                      {migrantForm.reason_for_leaving === '16' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Specify reason for leaving *</Label>
                          <Input value={migrantForm.reason_for_leaving_other} onChange={(e) => setMigrantForm((p) => ({ ...p, reason_for_leaving_other: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs">Reason for Transferring *</Label>
                        <Select value={migrantForm.reason_for_transferring} onValueChange={(v) => setMigrantForm((p) => ({ ...p, reason_for_transferring: v }))} className="h-8 text-xs">
                          <option value="">Select</option>
                          {reasonTransferringOptions.map((opt) => (
                            <option key={opt.code ?? opt.label} value={opt.code ?? opt.label}>{opt.label}</option>
                          ))}
                        </Select>
                      </div>
                      {migrantForm.reason_for_transferring === '5' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Specify reason for transferring *</Label>
                          <Input value={migrantForm.reason_for_transferring_other} onChange={(e) => setMigrantForm((p) => ({ ...p, reason_for_transferring_other: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs">Duration of Stay (current barangay) *</Label>
                        <Input value={migrantForm.duration_of_stay_current_barangay} onChange={(e) => setMigrantForm((p) => ({ ...p, duration_of_stay_current_barangay: e.target.value }))} className="h-8 text-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="panel-intention-return"
                          checked={migrantForm.intention_to_return}
                          onChange={(e) => setMigrantForm((p) => ({ ...p, intention_to_return: e.target.checked }))}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <Label htmlFor="panel-intention-return" className="text-xs cursor-pointer">Intention to return</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleAddMigrant} className="h-7 text-xs">Add</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddMigrant(false); setMigrantForm(emptyMigrantForm()) }} className="h-7 text-xs">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Existing migrants list */}
                  {panelMigrants.length > 0 && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {panelMigrants.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-1 rounded border border-border/50 p-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-foreground">{m.last_name}, {m.first_name}</span>
                            <span className="ml-2 text-muted-foreground">
                              {m.previous_residence}
                            </span>
                          </div>
                          <button type="button" onClick={() => handleDeleteMigrant(m.id)} className="shrink-0 text-destructive hover:text-destructive/80" aria-label="Remove migrant">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── form buttons ──────────────────────────────────── */}
              <div className="flex gap-2 pt-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── detail panel (flyout) ────────────────────────────────── */}
      <DetailPanel
        open={flyoutHousehold !== null}
        onClose={closeFlyout}
        title={flyoutHousehold ? `Household #${flyoutHousehold.household_number}` : ''}
        onEdit={canModify && flyoutHousehold ? () => { openEditPanel(flyoutHousehold); closeFlyout() } : undefined}
        onDelete={canModify && flyoutHousehold ? () => handleDelete(flyoutHousehold.id) : undefined}
        loading={flyoutLoading}
      >
        {flyoutHousehold && (
          <>
            {/* Address */}
            <DetailSection icon={<MapPin className="size-3" />} title="Address">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-muted-foreground">Region:</span> <span className="font-medium">{flyoutHousehold.region || '—'}</span></div>
                <div><span className="text-muted-foreground">Province:</span> <span className="font-medium">{flyoutHousehold.province || '—'}</span></div>
                <div><span className="text-muted-foreground">City/Municipality:</span> <span className="font-medium">{flyoutHousehold.city_municipality || '—'}</span></div>
                <div><span className="text-muted-foreground">Barangay:</span> <span className="font-medium">{flyoutHousehold.barangay || '—'}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Sitio/Purok:</span> <span className="font-medium">{flyoutHousehold.sitio_purok || '—'}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Complete Address:</span> <span className="font-medium">{flyoutHousehold.household_complete_address || flyoutHousehold.address || '—'}</span></div>
              </div>
            </DetailSection>

            {/* Classification */}
            <DetailSection icon={<Building2 className="size-3" />} title="Classification">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-muted-foreground">Household Type:</span> <span className="font-medium">{flyoutHousehold.household_type || '—'}</span></div>
                <div><span className="text-muted-foreground">Type (other):</span> <span className="font-medium">{flyoutHousehold.household_type_other || '—'}</span></div>
                <div><span className="text-muted-foreground">Tenure Status:</span> <span className="font-medium">{flyoutHousehold.tenure_status || '—'}</span></div>
                <div><span className="text-muted-foreground">Tenure (other):</span> <span className="font-medium">{flyoutHousehold.tenure_status_other || '—'}</span></div>
                <div><span className="text-muted-foreground">Household Unit:</span> <span className="font-medium">{flyoutHousehold.household_unit || '—'}</span></div>
                <div><span className="text-muted-foreground">Unit (other):</span> <span className="font-medium">{flyoutHousehold.household_unit_other || '—'}</span></div>
              </div>
            </DetailSection>

            {/* Demographics */}
            <DetailSection icon={<Users className="size-3" />} title="Demographics">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-muted-foreground">Household Name:</span> <span className="font-medium">{flyoutHousehold.household_name || '—'}</span></div>
                <div><span className="text-muted-foreground">No. of Families:</span> <span className="font-medium">{flyoutHousehold.no_of_families ?? '—'}</span></div>
                <div><span className="text-muted-foreground">No. of Members:</span> <span className="font-medium">{flyoutHousehold.no_of_household_members ?? '—'}</span></div>
                <div><span className="text-muted-foreground">No. of Migrants:</span> <span className="font-medium">{flyoutHousehold.no_of_migrants ?? '—'}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Monthly Income:</span> <span className="font-medium">{flyoutHousehold.monthly_income != null ? `PHP ${flyoutHousehold.monthly_income.toLocaleString()}` : '—'}</span></div>
              </div>
            </DetailSection>

            {/* Household Members */}
            <DetailSection icon={<Users className="size-3" />} title={`Members (${flyoutMembers.length})`}>
              {flyoutMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No members.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {flyoutMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-1 border-b border-border/30 pb-1 text-xs last:border-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-foreground">{m.last_name}, {m.first_name}</span>
                        {m.middle_name && <span className="text-muted-foreground"> {m.middle_name}</span>}
                        <span className="ml-1.5 text-muted-foreground">
                          {relationshipLabelMap.get(m.relationship_to_head) ?? m.relationship_to_head}
                        </span>
                      </div>
                      <span className="shrink-0 text-muted-foreground">
                        {m.source_of_income && incomeLabelMap.get(m.source_of_income) && (
                          <span className="mr-1">{incomeLabelMap.get(m.source_of_income)}</span>
                        )}
                        {m.monthly_income != null && m.monthly_income > 0 && (
                          <span className="text-foreground">PHP {m.monthly_income.toLocaleString()}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>

            {/* Migrant Info */}
            {flyoutMigrants.length > 0 && (
              <DetailSection icon={<ArrowUpDown className="size-3" />} title={`Migrants (${flyoutMigrants.length})`}>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {flyoutMigrants.map((m) => (
                    <div key={m.id} className="rounded border border-border/50 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{m.last_name}, {m.first_name}</span>
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', m.intention_to_return ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300')}>
                          {m.intention_to_return ? 'Will return' : 'No return'}
                        </span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        <div>Previous: {m.previous_residence}</div>
                        <div>Reason: {leavingLabelMap.get(m.reason_for_leaving) ?? m.reason_for_leaving}</div>
                        <div>Transferred: {formatDate(m.date_of_transfer)}</div>
                        <div>Duration here: {m.duration_of_stay_current_barangay}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Metadata */}
            <DetailSection title="Metadata">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Created: {formatDateTime(flyoutHousehold.created)}</div>
                <div>Updated: {formatDateTime(flyoutHousehold.updated)}</div>
              </div>
            </DetailSection>
          </>
        )}
      </DetailPanel>

      {/* ── confirm delete ────────────────────────────────────────── */}
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
