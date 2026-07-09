import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronDown, Search, Home, FileText, BookOpen, Activity, User, Fingerprint, Gift, Phone, Vote, Shield, Users } from 'lucide-react'
import { getResidents, createResident, updateResident, deleteResident, type InhabitantData, type ApiResident } from '@/api/residents'
import { searchHouseholds, getHousehold, type ApiHousehold } from '@/api/households'
import { getDocuments, type ApiDocument } from '@/api/documents'
import { getBlotters, type ApiBlotter } from '@/api/blotter'
import { getActivities, type ApiActivity } from '@/api/activity'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DetailPanel, DetailSection } from '@/components/ui/DetailPanel'
import { FormSection } from '@/components/ui/form-section'
import { Combobox } from '@/components/ui/combobox'
import { ConsentCheckbox } from '@/components/ui/consent-checkbox'
import { hasRole } from '@/auth/session'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { tagColors } from '@/lib/statusStyles'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { computeAge } from '@/lib/age'
import { formatMobileNumber, formatPhilsysCardNo } from '@/lib/validation'
import { useLookups } from '@/hooks/useLookups'

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

interface FormData {
  type_of_resident: string
  household_id: string
  philsys_card_no: string
  first_name: string
  last_name: string
  middle_name: string
  ext_name: string
  date_of_birth: string
  place_of_birth: string
  residence_of_mother_upon_birth: string
  sex: string
  gender: string
  civil_status: string
  pregnant_woman: boolean
  highest_educational_attainment: string
  profession_occupation: string
  mother_maiden_first_name: string
  mother_maiden_middle_name: string
  mother_maiden_last_name: string
  email_address: string
  mobile_number: string
  tel_number: string
  region: string
  province: string
  city_municipality: string
  barangay: string
  sitio_purok: string
  house_block_lot_no: string
  street_name: string
  subdivision_village: string
  zip_code: string
  blood_type: string
  height_m: number
  weight_kg: number
  complexion: string
  nationality: string
  ethnicity: string
  religion: string
  registered_voter: boolean
  resident_voter: boolean
  last_voted_year: number
  government_assistance_programs: string[]
  employed: boolean
  unemployed: boolean
  ofw: boolean
  indigenous_people: boolean
  student: boolean
  out_of_school_children: boolean
  out_of_school_youth: boolean
  migrant: boolean
  refugee: boolean
  senior_citizen: boolean
  pwd: boolean
  single_solo_parent: boolean
  data_privacy_consent: boolean
  consent_signature_date: string
  is_deceased: boolean
}

function emptyForm(): FormData {
  return {
    type_of_resident: '',
    household_id: '',
    philsys_card_no: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    ext_name: '',
    date_of_birth: '',
    place_of_birth: '',
    residence_of_mother_upon_birth: '',
    sex: '',
    gender: '',
    civil_status: '',
    pregnant_woman: false,
    highest_educational_attainment: '',
    profession_occupation: '',
    mother_maiden_first_name: '',
    mother_maiden_middle_name: '',
    mother_maiden_last_name: '',
    email_address: '',
    mobile_number: '',
    tel_number: '',
    region: '',
    province: '',
    city_municipality: '',
    barangay: '',
    sitio_purok: '',
    house_block_lot_no: '',
    street_name: '',
    subdivision_village: '',
    zip_code: '',
    blood_type: '',
    height_m: 0,
    weight_kg: 0,
    complexion: '',
    nationality: '',
    ethnicity: '',
    religion: '',
    registered_voter: false,
    resident_voter: false,
    last_voted_year: 0,
    government_assistance_programs: [],
    employed: false,
    unemployed: false,
    ofw: false,
    indigenous_people: false,
    student: false,
    out_of_school_children: false,
    out_of_school_youth: false,
    migrant: false,
    refugee: false,
    senior_citizen: false,
    pwd: false,
    single_solo_parent: false,
    data_privacy_consent: false,
    consent_signature_date: '',
    is_deceased: false,
  }
}

function HouseholdCombobox({ value, onChange }: { value: string; onChange: (id: string | null) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ApiHousehold[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ApiHousehold | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value) {
      getHousehold(value).then(setSelected).catch(() => setSelected(null))
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
        <input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => {
            setSelected(null)
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or household #..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-lg text-muted-foreground hover:text-foreground leading-none"
            aria-label="Clear household"
          >
            &times;
          </button>
        )}
      </div>
      {open && results.length > 0 && !selected && (
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

const sectoralKeys: { key: keyof FormData; label: string }[] = [
  { key: 'employed', label: 'Employed' },
  { key: 'unemployed', label: 'Unemployed' },
  { key: 'ofw', label: 'OFW' },
  { key: 'indigenous_people', label: 'Indigenous People' },
  { key: 'student', label: 'Student' },
  { key: 'out_of_school_children', label: 'Out-of-School Children' },
  { key: 'out_of_school_youth', label: 'Out-of-School Youth' },
  { key: 'migrant', label: 'Migrant' },
  { key: 'refugee', label: 'Refugee' },
  { key: 'senior_citizen', label: 'Senior Citizen' },
  { key: 'pwd', label: 'PWD' },
  { key: 'single_solo_parent', label: 'Single Solo Parent' },
]

const displayTagKeys: { key: string; label: string; color: string }[] = [
  { key: 'is_deceased', label: 'Deceased', color: tagColors.is_deceased },
  { key: 'senior_citizen', label: 'Senior Citizen', color: tagColors.is_senior },
  { key: 'pwd', label: 'PWD', color: tagColors.is_pwd },
]

const sectoralColorMap: Record<string, string> = {
  senior_citizen: tagColors.is_senior,
  pwd: tagColors.is_pwd,
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormData>(emptyForm())
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

  const { data: genderOptions } = useLookups('gender_options')
  const { data: civilStatusOptions } = useLookups('civil_status')
  const { data: educationalAttainment } = useLookups('educational_attainment')
  const { data: bloodTypeOptions } = useLookups('blood_type')
  const { data: nationalityOptions } = useLookups('nationality')
  const { data: ethnicityOptions } = useLookups('ethnicity')
  const { data: religionOptions } = useLookups('religion')
  const { data: govAssistanceOptions } = useLookups('government_assistance_program')

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

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleToggle(key: keyof FormData) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleGovAssistanceToggle(programValue: string) {
    setForm((prev) => {
      const current = prev.government_assistance_programs
      const next = current.includes(programValue)
        ? current.filter((v) => v !== programValue)
        : [...current, programValue]
      return { ...prev, government_assistance_programs: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim()) return

    try {
      const payload: Record<string, unknown> = { ...form }
      // Send age derived from date_of_birth for the server record
      payload.age = age

      // Convert empty strings to undefined for optional fields
      const optionalStringFields = [
        'middle_name', 'ext_name', 'philsys_card_no', 'place_of_birth',
        'residence_of_mother_upon_birth', 'profession_occupation',
        'email_address', 'mobile_number', 'tel_number',
        'region', 'province', 'city_municipality', 'barangay',
        'sitio_purok', 'house_block_lot_no', 'street_name', 'subdivision_village', 'zip_code',
        'blood_type', 'complexion', 'ethnicity', 'religion',
        'type_of_resident', 'household_id', 'gender', 'civil_status',
        'highest_educational_attainment', 'nationality',
        'mother_maiden_first_name', 'mother_maiden_middle_name', 'mother_maiden_last_name',
        'sex',
      ]
      for (const key of optionalStringFields) {
        if (payload[key] === '') payload[key] = undefined
      }

      // Convert 0 numbers to undefined
      if (!payload.height_m) payload.height_m = undefined
      if (!payload.weight_kg) payload.weight_kg = undefined
      if (!payload.last_voted_year) payload.last_voted_year = undefined

      // Remove empty consent_signature_date
      if (!payload.consent_signature_date) payload.consent_signature_date = undefined

      if (editingId) {
        const updated = await updateResident(editingId, payload as Partial<InhabitantData>)
        setResidents((prev) =>
          prev.map((r) => (r.id === editingId ? updated : r)),
        )
      } else {
        const created = await createResident(payload as InhabitantData)
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
      type_of_resident: record.type_of_resident || '',
      household_id: record.household_id || '',
      philsys_card_no: record.philsys_card_no || '',
      first_name: record.first_name,
      last_name: record.last_name,
      middle_name: record.middle_name || '',
      ext_name: record.ext_name || '',
      date_of_birth: record.date_of_birth || '',
      place_of_birth: record.place_of_birth || '',
      residence_of_mother_upon_birth: record.residence_of_mother_upon_birth || '',
      sex: record.sex || '',
      gender: record.gender || '',
      civil_status: record.civil_status || '',
      pregnant_woman: record.pregnant_woman || false,
      highest_educational_attainment: record.highest_educational_attainment || '',
      profession_occupation: record.profession_occupation || '',
      mother_maiden_first_name: record.mother_maiden_first_name || '',
      mother_maiden_middle_name: record.mother_maiden_middle_name || '',
      mother_maiden_last_name: record.mother_maiden_last_name || '',
      email_address: record.email_address || '',
      mobile_number: record.mobile_number || '',
      tel_number: record.tel_number || '',
      region: record.region || '',
      province: record.province || '',
      city_municipality: record.city_municipality || '',
      barangay: record.barangay || '',
      sitio_purok: record.sitio_purok || '',
      house_block_lot_no: record.house_block_lot_no || '',
      street_name: record.street_name || '',
      subdivision_village: record.subdivision_village || '',
      zip_code: record.zip_code || '',
      blood_type: record.blood_type || '',
      height_m: record.height_m || 0,
      weight_kg: record.weight_kg || 0,
      complexion: record.complexion || '',
      nationality: record.nationality || '',
      ethnicity: record.ethnicity || '',
      religion: record.religion || '',
      registered_voter: record.registered_voter || false,
      resident_voter: record.resident_voter || false,
      last_voted_year: record.last_voted_year || 0,
      government_assistance_programs: record.government_assistance_programs || [],
      employed: record.employed || false,
      unemployed: record.unemployed || false,
      ofw: record.ofw || false,
      indigenous_people: record.indigenous_people || false,
      student: record.student || false,
      out_of_school_children: record.out_of_school_children || false,
      out_of_school_youth: record.out_of_school_youth || false,
      migrant: record.migrant || false,
      refugee: record.refugee || false,
      senior_citizen: record.senior_citizen || false,
      pwd: record.pwd || false,
      single_solo_parent: record.single_solo_parent || false,
      data_privacy_consent: record.data_privacy_consent || false,
      consent_signature_date: record.consent_signature_date || '',
      is_deceased: record.is_deceased || false,
    })
    setAge(computeAge(record.date_of_birth))
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
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="size-3.5" />
          </div>
          <span className="font-medium">{r.last_name}, {r.first_name}{r.middle_name ? ' ' + r.middle_name : ''}</span>
        </div>
      ) },
    { key: 'sitio_purok', label: 'Sitio / Purok', sortable: true, filterType: 'text' },
    { key: 'sex', label: 'Sex', sortable: true, filterType: 'select',
      filterOptions: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
      ] },
    { key: 'date_of_birth', label: 'Age', sortable: true,
      render: (r) => (r.date_of_birth ? computeAge(r.date_of_birth).toString() : '') },
    { key: 'civil_status', label: 'Civil Status', sortable: true, filterType: 'select',
      filterOptions: [
        { label: 'Single', value: 'single' },
        { label: 'Married', value: 'married' },
        { label: 'Widowed', value: 'widowed' },
        { label: 'Separated', value: 'separated' },
        { label: 'Divorced', value: 'divorced' },
      ] },
    { key: 'type_of_resident', label: 'Type', sortable: true, filterType: 'select',
      filterOptions: [
        { label: 'Non-migrant', value: 'Non-migrant' },
        { label: 'Migrant', value: 'Migrant' },
        { label: 'Transient', value: 'Transient' },
      ] },
    { key: 'tags', label: 'Tags',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.is_deceased && (
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', tagColors.is_deceased)}>Deceased</span>
          )}
          {r.senior_citizen && (
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', tagColors.is_senior)}>Senior Citizen</span>
          )}
          {r.pwd && (
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', tagColors.is_pwd)}>PWD</span>
          )}
        </div>
      ) },
  ]

  return (
    <>
      <PageHeader title="RESIDENT PROFILES">
        {canModify && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            New Resident
          </Button>
        )}
      </PageHeader>

      <Card lifted={false} className="shadow-none">
        <CardContent className="p-0">
          <DataTable
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
        </CardContent>
      </Card>

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
            <form onSubmit={handleSubmit} className="space-y-0 p-5">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive mb-5">
                  {error}
                </div>
              )}

              {/* Section 1 — Classification */}
              <FormSection icon={<User className="size-4" />} title="Classification" defaultOpen>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-type-of-resident">Type of Resident</Label>
                    <Select id="panel-type-of-resident" value={form.type_of_resident} onValueChange={(v) => updateField('type_of_resident', v)}>
                      <option value="">Select type</option>
                      <option value="Non-migrant">Non-migrant</option>
                      <option value="Migrant">Migrant</option>
                      <option value="Transient">Transient</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-household">Household</Label>
                    <HouseholdCombobox value={form.household_id} onChange={(id) => updateField('household_id', id ?? '')} />
                  </div>
                </div>
              </FormSection>

              {/* Section 2 — Personal Information */}
              <FormSection icon={<FileText className="size-4" />} title="Personal Information" defaultOpen>
                <div className="space-y-2">
                  <Label htmlFor="panel-philsys">PhilSys Card No.</Label>
                  <Input
                    id="panel-philsys"
                    value={form.philsys_card_no}
                    onChange={(e) => updateField('philsys_card_no', e.target.value)}
                    onBlur={(e) => updateField('philsys_card_no', formatPhilsysCardNo(e.target.value))}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                  />
                </div>

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
                    <Label htmlFor="panel-ext-name">Extension Name</Label>
                    <Input id="panel-ext-name" value={form.ext_name} onChange={(e) => updateField('ext_name', e.target.value)} placeholder="e.g., Jr., Sr." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-dob">Date of Birth</Label>
                    <Input id="panel-dob" type="date" value={form.date_of_birth} onChange={(e) => { updateField('date_of_birth', e.target.value); setAge(computeAge(e.target.value)) }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-age">Age</Label>
                    <Input id="panel-age" type="number" value={age || ''} disabled className="opacity-70" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panel-pob">Place of Birth *</Label>
                  <Input id="panel-pob" value={form.place_of_birth} onChange={(e) => updateField('place_of_birth', e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panel-mother-residence">Residence of Mother Upon Birth</Label>
                  <Input id="panel-mother-residence" value={form.residence_of_mother_upon_birth} onChange={(e) => updateField('residence_of_mother_upon_birth', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-sex">Sex *</Label>
                    <Select id="panel-sex" value={form.sex} onValueChange={(v) => updateField('sex', v)} required>
                      <option value="">Select sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </Select>
                    {form.sex === 'Female' && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="panel-pregnant"
                          checked={form.pregnant_woman}
                          onChange={(e) => updateField('pregnant_woman', e.target.checked)}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <Label htmlFor="panel-pregnant" className="text-xs cursor-pointer">Pregnant Woman</Label>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-gender">Gender</Label>
                    <Select id="panel-gender" value={form.gender} onValueChange={(v) => updateField('gender', v)}>
                      <option value="">Select gender</option>
                      {genderOptions.map((opt) => (
                        <option key={opt.label} value={opt.code ?? opt.label}>{opt.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-civil-status">Civil Status</Label>
                    <Select id="panel-civil-status" value={form.civil_status} onValueChange={(v) => updateField('civil_status', v)}>
                      <option value="">Select status</option>
                      {civilStatusOptions.map((opt) => (
                        <option key={opt.label} value={opt.code ?? opt.label}>{opt.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-edu-attainment">Highest Educational Attainment</Label>
                    <Combobox
                      options={educationalAttainment.map((o) => ({ label: o.label, value: o.code ?? o.label }))}
                      value={form.highest_educational_attainment}
                      onChange={(v) => updateField('highest_educational_attainment', v)}
                      placeholder="Search attainment..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panel-occupation">Profession / Occupation</Label>
                  <Input id="panel-occupation" value={form.profession_occupation} onChange={(e) => updateField('profession_occupation', e.target.value)} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-mother-first">Mother's Maiden First Name</Label>
                    <Input id="panel-mother-first" value={form.mother_maiden_first_name} onChange={(e) => updateField('mother_maiden_first_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-mother-middle">Mother's Maiden Middle Name</Label>
                    <Input id="panel-mother-middle" value={form.mother_maiden_middle_name} onChange={(e) => updateField('mother_maiden_middle_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-mother-last">Mother's Maiden Last Name</Label>
                    <Input id="panel-mother-last" value={form.mother_maiden_last_name} onChange={(e) => updateField('mother_maiden_last_name', e.target.value)} />
                  </div>
                </div>
              </FormSection>

              {/* Section 3 — Contact Details */}
              <FormSection icon={<Phone className="size-4" />} title="Contact Details">
                <div className="space-y-2">
                  <Label htmlFor="panel-email">Email Address</Label>
                  <Input id="panel-email" type="email" value={form.email_address} onChange={(e) => updateField('email_address', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-mobile">Mobile Number</Label>
                    <Input id="panel-mobile" value={form.mobile_number} onChange={(e) => updateField('mobile_number', e.target.value)} onBlur={(e) => updateField('mobile_number', formatMobileNumber(e.target.value))} placeholder="09XXXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-tel">Telephone Number</Label>
                    <Input id="panel-tel" value={form.tel_number} onChange={(e) => updateField('tel_number', e.target.value)} />
                  </div>
                </div>
              </FormSection>

              {/* Section 4 — Address */}
              <FormSection icon={<Home className="size-4" />} title="Address">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-region">Region *</Label>
                    <Input id="panel-region" value={form.region} onChange={(e) => updateField('region', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-province">Province *</Label>
                    <Input id="panel-province" value={form.province} onChange={(e) => updateField('province', e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-city">City / Municipality *</Label>
                    <Input id="panel-city" value={form.city_municipality} onChange={(e) => updateField('city_municipality', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-barangay">Barangay *</Label>
                    <Input id="panel-barangay" value={form.barangay} onChange={(e) => updateField('barangay', e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-sitio-purok">Sitio / Purok</Label>
                    <Input id="panel-sitio-purok" value={form.sitio_purok} onChange={(e) => updateField('sitio_purok', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-house-lot">House / Block / Lot No.</Label>
                    <Input id="panel-house-lot" value={form.house_block_lot_no} onChange={(e) => updateField('house_block_lot_no', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-street">Street Name</Label>
                    <Input id="panel-street" value={form.street_name} onChange={(e) => updateField('street_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-subdivision">Subdivision / Village</Label>
                    <Input id="panel-subdivision" value={form.subdivision_village} onChange={(e) => updateField('subdivision_village', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-zip">ZIP Code</Label>
                  <Input id="panel-zip" value={form.zip_code} onChange={(e) => updateField('zip_code', e.target.value)} />
                </div>
              </FormSection>

              {/* Section 5 — Identity Information */}
              <FormSection icon={<Fingerprint className="size-4" />} title="Identity Information">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-blood-type">Blood Type</Label>
                    <Select id="panel-blood-type" value={form.blood_type} onValueChange={(v) => updateField('blood_type', v)}>
                      <option value="">Select type</option>
                      {bloodTypeOptions.map((opt) => (
                        <option key={opt.label} value={opt.code ?? opt.label}>{opt.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-complexion">Complexion</Label>
                    <Select id="panel-complexion" value={form.complexion} onValueChange={(v) => updateField('complexion', v)}>
                      <option value="">Select complexion</option>
                      <option value="Fair">Fair</option>
                      <option value="Medium">Medium</option>
                      <option value="Dark">Dark</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-height">Height (m)</Label>
                    <Input id="panel-height" type="number" step="0.01" min="0" value={form.height_m || ''} onChange={(e) => updateField('height_m', e.target.value ? parseFloat(e.target.value) : 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-weight">Weight (kg)</Label>
                    <Input id="panel-weight" type="number" step="0.1" min="0" value={form.weight_kg || ''} onChange={(e) => updateField('weight_kg', e.target.value ? parseFloat(e.target.value) : 0)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="panel-nationality">Nationality *</Label>
                    <Select id="panel-nationality" value={form.nationality} onValueChange={(v) => updateField('nationality', v)}>
                      <option value="">Select nationality</option>
                      {nationalityOptions.map((opt) => (
                        <option key={opt.label} value={opt.code ?? opt.label}>{opt.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-religion">Religion *</Label>
                    <Select id="panel-religion" value={form.religion} onValueChange={(v) => updateField('religion', v)}>
                      <option value="">Select religion</option>
                      {religionOptions.map((opt) => (
                        <option key={opt.label} value={opt.code ?? opt.label}>{opt.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-ethnicity">Ethnicity</Label>
                  <Combobox
                    options={ethnicityOptions.map((o) => ({ label: o.label, value: o.code ?? o.label }))}
                    value={form.ethnicity}
                    onChange={(v) => updateField('ethnicity', v)}
                    placeholder="Search ethnicity..."
                  />
                </div>
              </FormSection>

              {/* Section 6 — Voter Info */}
              <FormSection icon={<Vote className="size-4" />} title="Voter Info">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="panel-registered-voter"
                      checked={form.registered_voter}
                      onChange={(e) => updateField('registered_voter', e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <Label htmlFor="panel-registered-voter" className="cursor-pointer">Registered Voter</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="panel-resident-voter"
                      checked={form.resident_voter}
                      onChange={(e) => updateField('resident_voter', e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <Label htmlFor="panel-resident-voter" className="cursor-pointer">Resident Voter</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-last-voted">Last Voted Year</Label>
                    <Input id="panel-last-voted" type="number" min="1900" max="2099" step="1" value={form.last_voted_year || ''} onChange={(e) => updateField('last_voted_year', e.target.value ? parseInt(e.target.value, 10) : 0)} />
                  </div>
                </div>
              </FormSection>

              {/* Section 7 — Beneficiary Info */}
              <FormSection icon={<Gift className="size-4" />} title="Beneficiary Info">
                <div className="space-y-2">
                  <Label>Government Assistance Programs</Label>
                  <div className="flex flex-wrap gap-2">
                    {govAssistanceOptions.length === 0 && (
                      <p className="text-xs text-muted-foreground">No programs available</p>
                    )}
                    {govAssistanceOptions.map((opt) => {
                      const val = opt.code ?? opt.label
                      const active = form.government_assistance_programs.includes(val)
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleGovAssistanceToggle(val)}
                          className={cn(
                            'rounded-md px-4 py-1 text-xs font-bold transition-colors',
                            active
                              ? 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/30'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80',
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </FormSection>

              {/* Section 8 — Sectoral Info */}
              <FormSection icon={<Users className="size-4" />} title="Sectoral Info">
                <div className="space-y-2">
                  <Label>Sectoral Affiliations</Label>
                  <div className="flex flex-wrap gap-2">
                    {sectoralKeys.map(({ key, label }) => {
                      const active = form[key] as boolean
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleToggle(key)}
                          className={cn(
                            'rounded-md px-4 py-1 text-xs font-bold transition-colors',
                            active
                              ? (sectoralColorMap[key] || 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30')
                              : 'bg-muted text-muted-foreground hover:bg-muted/80',
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </FormSection>

              {/* Section 9 — Consent */}
              <FormSection icon={<Shield className="size-4" />} title="Consent">
                <ConsentCheckbox
                  checked={form.data_privacy_consent}
                  onChange={(checked) => {
                    updateField('data_privacy_consent', checked)
                    if (checked) {
                      updateField('consent_signature_date', new Date().toISOString().split('T')[0])
                    }
                  }}
                />
              </FormSection>

              <div className="flex gap-2 pt-5">
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
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{flyoutResident.first_name} {flyoutResident.last_name}</span></div>
                <div><span className="text-muted-foreground">Sex:</span> {flyoutResident.sex || '—'}</div>
                <div><span className="text-muted-foreground">Gender:</span> {flyoutResident.gender || '—'}</div>
                <div><span className="text-muted-foreground">DOB:</span> {formatDate(flyoutResident.date_of_birth)}</div>
                <div><span className="text-muted-foreground">Age:</span> {flyoutResident.date_of_birth ? computeAge(flyoutResident.date_of_birth) : '—'}</div>
                <div><span className="text-muted-foreground">Place of Birth:</span> {flyoutResident.place_of_birth || '—'}</div>
                <div><span className="text-muted-foreground">Civil Status:</span> {flyoutResident.civil_status ? (flyoutResident.civil_status.charAt(0).toUpperCase() + flyoutResident.civil_status.slice(1)) : '—'}</div>
                <div><span className="text-muted-foreground">Type:</span> {flyoutResident.type_of_resident || '—'}</div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Contact:</span>{' '}
                  {[flyoutResident.email_address, flyoutResident.mobile_number, flyoutResident.tel_number].filter(Boolean).join(' | ') || '—'}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address:</span>{' '}
                  {[flyoutResident.house_block_lot_no, flyoutResident.street_name, flyoutResident.subdivision_village, flyoutResident.sitio_purok, flyoutResident.barangay, flyoutResident.city_municipality, flyoutResident.province, flyoutResident.region, flyoutResident.zip_code].filter(Boolean).join(', ') || '—'}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Identity:</span>{' '}
                  {[flyoutResident.nationality, flyoutResident.ethnicity, flyoutResident.religion, flyoutResident.blood_type].filter(Boolean).join(' | ') || '—'}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Voter:</span>{' '}
                  {flyoutResident.registered_voter ? 'Registered' : 'Not registered'}
                  {flyoutResident.resident_voter ? ', Resident Voter' : ''}
                  {flyoutResident.last_voted_year ? ` (Last voted: ${flyoutResident.last_voted_year})` : ''}
                </div>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {displayTagKeys.map(({ key, label, color }) =>
                    (flyoutResident as Record<string, unknown>)[key] ? (
                      <span key={key} className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', color)}>
                        {label}
                      </span>
                    ) : null
                  )}
                  {sectoralKeys
                    .filter(({ key }) => (flyoutResident as Record<string, unknown>)[key])
                    .map(({ key, label }) => (
                      <span key={key} className={cn('inline-flex rounded-md px-3 py-0.5 text-xs font-bold', sectoralColorMap[key] || 'bg-blue-200 text-blue-900 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/30')}>
                        {label}
                      </span>
                    ))
                  }
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
