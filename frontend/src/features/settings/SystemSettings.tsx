import { useState, useEffect, useRef } from 'react'
import { Loader2, X, Plus, Building2, Users, MapPin, ShieldAlert, CheckCircle2, AlertTriangle, Database, Trash2 } from 'lucide-react'
import { getClient } from '@/api/client'
import { updateSetting, type ApiSetting } from '@/api/settings'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AVAILABLE_COLLECTIONS, seedCollections, eraseCollections } from './demoData'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast as showToast } from '@/lib/toast'

interface TagInputProps {
  items: string[]
  placeholder: string
  onChange: (items: string[]) => void
}

function TagInput({ items, placeholder, onChange }: TagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function add() {
    const trimmed = input.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setInput('')
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 min-h-7">
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground/60 italic">None added yet</span>
        )}
        {items.map((item, i) => (
          <span
            key={item}
            className="inline-flex motion-scale-in items-center gap-1 rounded-md border bg-secondary/50 px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(i)}
              className="inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
              aria-label={`Remove ${item}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
          }}
          placeholder={placeholder}
          className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
          aria-label="Add"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

interface SettingsFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  required?: boolean
  placeholder?: string
}

function SettingsField({ label, value, onChange, required, placeholder }: SettingsFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground/80">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
      />
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function SystemSettings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settingIds, setSettingIds] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)

  const [barangayName, setBarangayName] = useState('')
  const [municipalityCity, setMunicipalityCity] = useState('')
  const [province, setProvince] = useState('')
  const [region, setRegion] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [barangayCaptain, setBarangayCaptain] = useState('')
  const [barangaySecretary, setBarangaySecretary] = useState('')
  const [barangayTreasurer, setBarangayTreasurer] = useState('')
  const [purokOptions, setPurokOptions] = useState<string[]>([])
  const [incidentTypes, setIncidentTypes] = useState<string[]>([])

  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set(AVAILABLE_COLLECTIONS.map((c) => c.id)))
  const [seeding, setSeeding] = useState(false)
  const [erasing, setErasing] = useState(false)
  const [showEraseConfirm, setShowEraseConfirm] = useState(false)
  const [progress, setProgress] = useState<string[]>([])

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const stateRef = useRef({
    barangayName, municipalityCity, province, region, postalCode, contactNumber,
    barangayCaptain, barangaySecretary, barangayTreasurer,
    purokOptions, incidentTypes, settingIds,
  })
  stateRef.current = {
    barangayName, municipalityCity, province, region, postalCode, contactNumber,
    barangayCaptain, barangaySecretary, barangayTreasurer,
    purokOptions, incidentTypes, settingIds,
  }

  useEffect(() => {
    loadSettings()
    return () => {
      clearTimeout(saveTimerRef.current)
      clearTimeout(toastTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(toastTimerRef.current)
  }, [toast])

  async function loadSettings() {
    try {
      setLoading(true)
      setError(null)
      const records = await getClient().collection('system_settings').getFullList<ApiSetting>()
      const ids: Record<string, string> = {}
      const vals: Record<string, any> = {}
      for (const r of records) { ids[r.key] = r.id; vals[r.key] = r.value }

      setSettingIds(ids)
      setBarangayName(vals.barangay_name ?? '')
      setMunicipalityCity(vals.municipality_city ?? '')
      setProvince(vals.province ?? '')
      setRegion(vals.region ?? '')
      setPostalCode(vals.postal_code ?? '')
      setContactNumber(vals.contact_number ?? '')
      setBarangayCaptain(vals.barangay_captain ?? '')
      setBarangaySecretary(vals.barangay_secretary ?? '')
      setBarangayTreasurer(vals.barangay_treasurer ?? '')
      setPurokOptions(vals.purok_options ?? [])
      setIncidentTypes(vals.incident_types ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(performSave, 1500)
  }

  async function performSave() {
    const s = stateRef.current
    const entries: [string, string | string[]][] = [
      ['barangay_name', s.barangayName],
      ['municipality_city', s.municipalityCity],
      ['province', s.province],
      ['region', s.region],
      ['postal_code', s.postalCode],
      ['contact_number', s.contactNumber],
      ['barangay_captain', s.barangayCaptain],
      ['barangay_secretary', s.barangaySecretary],
      ['barangay_treasurer', s.barangayTreasurer],
      ['purok_options', s.purokOptions],
      ['incident_types', s.incidentTypes],
    ]

    try {
      setAutoSaving(true)
      await Promise.all(
        entries.map(([key, value]) => {
          const id = s.settingIds[key]
          if (!id) return Promise.resolve()
          return updateSetting(id, key, value)
        }),
      )
      setToast({ type: 'success', message: 'Settings saved.' })
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setAutoSaving(false)
    }
  }

  function onChange(setter: (val: string) => void): (val: string) => void {
    return (val) => { setter(val); scheduleSave() }
  }

  function onArrayChange(setter: (items: string[]) => void): (items: string[]) => void {
    return (items) => { setter(items); scheduleSave() }
  }

  function toggleCollection(id: string) {
    setSelectedCollections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedCollections.size === AVAILABLE_COLLECTIONS.length) {
      setSelectedCollections(new Set())
    } else {
      setSelectedCollections(new Set(AVAILABLE_COLLECTIONS.map((c) => c.id)))
    }
  }

  function addProgress(msg: string) {
    setProgress((prev) => [...prev, msg])
  }

  async function handleSeed() {
    const ids = [...selectedCollections]
    if (ids.length === 0) { showToast.error('Select at least one collection.'); return }
    setSeeding(true)
    setProgress([])
    const result = await seedCollections(ids, addProgress)
    addProgress(`Done! ${result.total} records created.`)
    if (result.errors.length > 0) {
      addProgress(`Errors: ${result.errors.length}`)
      result.errors.slice(0, 5).forEach((e) => addProgress(`  - ${e}`))
    }
    setSeeding(false)
  }

  async function handleErase() {
    setShowEraseConfirm(false)
    const ids = [...selectedCollections]
    setErasing(true)
    setProgress([])
    const result = await eraseCollections(ids, addProgress)
    addProgress(`Done! ${result.total} records deleted.`)
    if (result.errors.length > 0) {
      addProgress(`Errors: ${result.errors.length}`)
      result.errors.slice(0, 5).forEach((e) => addProgress(`  - ${e}`))
    }
    setErasing(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader title="System Settings" />
      <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card shadow-sm p-4 space-y-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-8 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <SkeletonBlock className="h-8 w-full" />
                <SkeletonBlock className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader title="System Settings" />
        <div className="mx-auto max-w-lg rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadSettings}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="System Settings">
        {autoSaving && (
          <span className="flex motion-fade-in items-center gap-1.5 text-xs text-muted-foreground/60">
            <Loader2 className="size-3 animate-spin" />
            Saving...
          </span>
        )}
      </PageHeader>

      <div className="space-y-3">
        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <Building2 className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Barangay Information
            </h2>
          </div>
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-2 gap-3">
              <SettingsField label="Barangay Name" value={barangayName} onChange={onChange(setBarangayName)} required />
              <SettingsField label="Municipality / City" value={municipalityCity} onChange={onChange(setMunicipalityCity)} required />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SettingsField label="Province" value={province} onChange={onChange(setProvince)} placeholder="e.g. Capiz" />
              <SettingsField label="Region" value={region} onChange={onChange(setRegion)} placeholder="e.g. VI" />
              <SettingsField label="Postal Code" value={postalCode} onChange={onChange(setPostalCode)} placeholder="e.g. 5800" />
              <SettingsField label="Contact No." value={contactNumber} onChange={onChange(setContactNumber)} placeholder="e.g. 0917..." />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '75ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <Users className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Barangay Officials
            </h2>
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3">
              <SettingsField label="Barangay Captain" value={barangayCaptain} onChange={onChange(setBarangayCaptain)} placeholder="Full name" />
              <SettingsField label="Barangay Secretary" value={barangaySecretary} onChange={onChange(setBarangaySecretary)} placeholder="Full name" />
              <SettingsField label="Barangay Treasurer" value={barangayTreasurer} onChange={onChange(setBarangayTreasurer)} placeholder="Full name" />
            </div>
        </section>

        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <MapPin className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Purok Options
            </h2>
          </div>
          <div className="p-3">
            <p className="mb-2.5 text-[11px] text-muted-foreground/60">
              Puroks and sitios available when assigning locations on records.
            </p>
            <TagInput items={purokOptions} placeholder="Add purok..." onChange={onArrayChange(setPurokOptions)} />
          </div>
        </section>

        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '225ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <ShieldAlert className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Incident Types
            </h2>
          </div>
          <div className="p-3">
            <p className="mb-2.5 text-[11px] text-muted-foreground/60">
              Categories used to classify incidents and complaints.
            </p>
            <TagInput items={incidentTypes} placeholder="Add type..." onChange={onArrayChange(setIncidentTypes)} />
          </div>
        </section>

        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <Database className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Demo Data Management
            </h2>
          </div>
          <div className="p-3 space-y-3">
            <p className="text-[11px] text-muted-foreground/60">
              Populate the system with realistic sample data for testing and demonstrations, or erase existing records to start fresh.
            </p>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-gold hover:text-gold/80 transition-colors"
              >
                {selectedCollections.size === AVAILABLE_COLLECTIONS.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-[11px] text-muted-foreground/50">
                {selectedCollections.size} / {AVAILABLE_COLLECTIONS.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {AVAILABLE_COLLECTIONS.map((c) => {
                const checked = selectedCollections.has(c.id)
                return (
                  <label
                    key={c.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer transition-colors',
                      checked
                        ? 'border-gold/50 bg-gold/5'
                        : 'border-input bg-background hover:bg-accent',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCollection(c.id)}
                      className="size-3.5 rounded border-input text-gold focus:ring-gold/30 focus:ring-offset-0"
                    />
                    {c.label}
                  </label>
                )
              })}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSeed}
                disabled={seeding || erasing || selectedCollections.size === 0}
                className="gap-1.5"
              >
                {seeding ? <Loader2 className="size-3.5 animate-spin" /> : <Database className="size-3.5" />}
                {seeding ? 'Seeding...' : 'Seed Demo Data'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowEraseConfirm(true)}
                disabled={seeding || erasing || selectedCollections.size === 0}
                className="gap-1.5"
              >
                {erasing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                {erasing ? 'Erasing...' : 'Erase Selected'}
              </Button>
            </div>

            {progress.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-md border border-input bg-muted/30 p-2 space-y-0.5">
                {progress.map((msg, i) => (
                  <p key={i} className={cn(
                    'text-[11px] font-mono leading-relaxed',
                    msg.startsWith('Done!') ? 'text-emerald-600 dark:text-emerald-400' :
                    msg.startsWith('Error') || msg.startsWith('  - ') ? 'text-destructive' :
                    'text-muted-foreground/80',
                  )}>
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 motion-slide-up">
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-foreground shadow-lg backdrop-blur-sm',
              toast.type === 'success' ? 'border-emerald-500/30' : 'border-destructive/30',
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-destructive" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 shrink-0 text-muted-foreground opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showEraseConfirm}
        title="Erase selected data?"
        message={`This will permanently delete all records from ${selectedCollections.size} selected collection(s). This action cannot be undone.`}
        confirmLabel="Erase Everything"
        destructive
        loading={erasing}
        onConfirm={handleErase}
        onCancel={() => setShowEraseConfirm(false)}
      />
    </div>
  )
}
