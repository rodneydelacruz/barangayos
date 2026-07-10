import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ChevronDown, Search, User, Calendar, Skull } from 'lucide-react'
import {
  getDeceasedRecords,
  createDeceasedRecord,
  updateDeceasedRecord,
  deleteDeceasedRecord,
  type ApiDeceasedRecord,
} from '@/api/deceasedRecords'
import { getResidents, type ApiResident } from '@/api/residents'
import { useLookups } from '@/hooks/useLookups'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DetailPanel, DetailSection, FieldRow } from '@/components/ui/DetailPanel'
import { hasRole } from '@/auth/session'
import { formatDate, formatDateTime } from '@/lib/utils'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'

function InhabitantCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ApiResident[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ApiResident | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      getResidents()
        .then((all) => {
          const found = all.find((r) => r.id === value)
          if (found) setSelected(found)
        })
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
    if (!query || selected) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const all = await getResidents()
        const q = query.toLowerCase()
        setResults(
          all
            .filter((r) =>
              `${r.first_name} ${r.last_name} ${r.middle_name}`
                .toLowerCase()
                .includes(q),
            )
            .slice(0, 10),
        )
      } catch {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, selected])

  function handleSelect(r: ApiResident) {
    setSelected(r)
    onChange(r.id)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    onChange(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const displayValue = selected
    ? `${selected.first_name} ${selected.last_name}`
    : query

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="panel-inhabitant"
          value={displayValue}
          onChange={(e) => {
            setSelected(null)
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search resident by name..."
          className="h-9 pl-8 text-sm"
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-lg text-muted-foreground hover:text-foreground leading-none"
            aria-label="Clear resident"
          >
            ×
          </button>
        )}
      </div>
      {open && results.length > 0 && query && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className="font-medium">
                {r.first_name} {r.last_name}
              </span>
              {r.type_of_resident ? (
                <span className="ml-auto text-xs text-muted-foreground">
                  {r.type_of_resident}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
      {open && !selected && query && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background p-2 text-sm text-muted-foreground shadow-lg">
          No residents found
        </div>
      )}
    </div>
  )
}

function emptyForm() {
  return {
    inhabitant_id: '',
    date_of_death: '',
    immediate_cause_of_death: '',
    underlying_cause_of_death: '',
    underlying_cause_other: '',
  }
}

export default function DeceasedRecordsPage() {
  const [records, setRecords] = useState<ApiDeceasedRecord[]>([])
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [loading, setLoading] = useState(true)
  const [flyoutRecord, setFlyoutRecord] = useState<ApiDeceasedRecord | null>(null)

  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  useBodyScrollLock(panelOpen)
  const [error, setError] = useState<string | null>(null)

  const { data: underlyingCauseOptions } = useLookups('underlying_cause_of_death')

  useEffect(() => {
    Promise.all([getDeceasedRecords(), getResidents()])
      .then(([d, r]) => {
        setRecords(d)
        setResidents(r)
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : 'Failed to load deceased records',
        ),
      )
      .finally(() => setLoading(false))
  }, [])

  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('selected')

  useEffect(() => {
    if (selectedId && records.length > 0) {
      const record = records.find((r) => r.id === selectedId)
      if (record) {
        setFlyoutRecord(record)
      }
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId, records])

  function getResidentName(id: string): string {
    const r = residents.find((res) => res.id === id)
    return r ? `${r.first_name} ${r.last_name}` : '—'
  }

  function getResident(id: string): ApiResident | undefined {
    return residents.find((res) => res.id === id)
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !form.inhabitant_id.trim() ||
      !form.date_of_death.trim() ||
      !form.immediate_cause_of_death.trim() ||
      !form.underlying_cause_of_death.trim()
    )
      return

    try {
      const payload = { ...form }
      if (payload.underlying_cause_of_death !== 'Others (specify)') {
        payload.underlying_cause_other = ''
      }
      if (editingId) {
        const updated = await updateDeceasedRecord(editingId, payload)
        setRecords((prev) =>
          prev.map((r) => (r.id === editingId ? updated : r)),
        )
      } else {
        const created = await createDeceasedRecord(payload)
        setRecords((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save deceased record',
      )
    }
  }

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiDeceasedRecord) {
    setEditingId(record.id)
    setForm({
      inhabitant_id: record.inhabitant_id,
      date_of_death: record.date_of_death,
      immediate_cause_of_death: record.immediate_cause_of_death,
      underlying_cause_of_death: record.underlying_cause_of_death,
      underlying_cause_other: record.underlying_cause_other || '',
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
      await deleteDeceasedRecord(deletingId)
      setRecords((prev) => prev.filter((r) => r.id !== deletingId))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete deceased record',
      )
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

  const columns: Column<ApiDeceasedRecord>[] = [
    {
      key: 'inhabitant_id',
      label: 'Deceased Name',
      sortable: true,
      filterType: 'text',
      filterValue: (r) => getResidentName(r.inhabitant_id),
      render: (r) => {
        const inhabitant = getResident(r.inhabitant_id)
        return (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <User className="size-3.5" />
            </div>
            <span className="font-medium">
              {inhabitant
                ? `${inhabitant.first_name} ${inhabitant.last_name}`
                : '—'}
            </span>
          </div>
        )
      },
    },
    {
      key: 'date_of_death',
      label: 'Date of Death',
      sortable: true,
      render: (r) => formatDate(r.date_of_death),
    },
    {
      key: 'immediate_cause_of_death',
      label: 'Immediate Cause',
      render: (r) => r.immediate_cause_of_death || '—',
    },
    {
      key: 'underlying_cause_of_death',
      label: 'Underlying Cause',
      sortable: true,
      filterType: 'select',
      filterOptions: underlyingCauseOptions.map((opt) => ({
        label: opt.label,
        value: opt.code ?? opt.label,
      })),
      render: (r) => r.underlying_cause_of_death || '—',
    },
    {
      key: 'created',
      label: 'Created',
      sortable: true,
      render: (r) => formatDateTime(r.created),
    },
  ]

  function closeFlyout() {
    setFlyoutRecord(null)
  }

  return (
    <>
      <PageHeader title="Deceased Records">
        {canModify && (
          <Button
            size="sm"
            className="gap-1.5 motion-press"
            onClick={openCreatePanel}
          >
            <Plus className="size-3.5" />
            New Record
          </Button>
        )}
      </PageHeader>

      <Card lifted={false} className="shadow-none">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={records}
            loading={loading}
            onRowClick={(r) => setFlyoutRecord(r)}
            emptyState={
              records.length === 0
                ? (
                  <EmptyState
                    title="No deceased records yet"
                    description="Add your first deceased record."
                    action={
                      canModify
                        ? {
                          label: 'Create first record',
                          onClick: openCreatePanel,
                        }
                        : undefined
                    }
                  />
                )
                : undefined
            }
            rowKey={(r) => r.id}
            toolbar
            exportable
          />
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div
            className="fixed inset-0 bg-black/40 motion-fade-in"
            onClick={closePanel}
            aria-hidden="true"
          />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:w-1/2 md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl font-display">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">
                {editingId ? 'Edit Deceased Record' : 'New Deceased Record'}
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
                <Label htmlFor="panel-inhabitant">Deceased Resident *</Label>
                <InhabitantCombobox
                  value={form.inhabitant_id}
                  onChange={(id) => updateField('inhabitant_id', id ?? '')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-date-of-death">Date of Death *</Label>
                <Input
                  id="panel-date-of-death"
                  type="date"
                  value={form.date_of_death}
                  onChange={(e) => updateField('date_of_death', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-immediate-cause">
                  Immediate Cause of Death *
                </Label>
                <textarea
                  id="panel-immediate-cause"
                  value={form.immediate_cause_of_death}
                  onChange={(e) =>
                    updateField('immediate_cause_of_death', e.target.value)
                  }
                  rows={3}
                  required
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-underlying-cause">
                  Underlying Cause of Death *
                </Label>
                <Select
                  id="panel-underlying-cause"
                  value={form.underlying_cause_of_death}
                  onValueChange={(v) =>
                    updateField('underlying_cause_of_death', v)
                  }
                  required
                >
                  <option value="">Select underlying cause</option>
                  {underlyingCauseOptions.map((opt) => (
                    <option key={opt.code ?? opt.label} value={opt.code ?? opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              {form.underlying_cause_of_death === 'Others (specify)' && (
                <div className="space-y-2">
                  <Label htmlFor="panel-underlying-other">
                    Please specify
                  </Label>
                  <Input
                    id="panel-underlying-other"
                    value={form.underlying_cause_other}
                    onChange={(e) =>
                      updateField('underlying_cause_other', e.target.value)
                    }
                    placeholder="Specify underlying cause..."
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'}
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
        open={flyoutRecord !== null}
        onClose={closeFlyout}
        title={
          flyoutRecord
            ? getResidentName(flyoutRecord.inhabitant_id)
            : ''
        }
        onEdit={
          canModify && flyoutRecord
            ? () => {
              openEditPanel(flyoutRecord)
              closeFlyout()
            }
            : undefined
        }
        onDelete={
          canModify && flyoutRecord
            ? () => handleDelete(flyoutRecord.id)
            : undefined
        }
      >
        {flyoutRecord &&
          (() => {
            const inhabitant = getResident(flyoutRecord.inhabitant_id)
            return (
              <>
                <DetailSection
                  icon={<User className="size-3" />}
                  title="Inhabitant Info"
                >
                  <FieldRow label="Name">
                    <span className="font-medium text-foreground">
                      {inhabitant
                        ? `${inhabitant.first_name} ${inhabitant.last_name}`
                        : '—'}
                    </span>
                  </FieldRow>
                  <FieldRow label="Type of Resident" value={inhabitant?.type_of_resident || '—'} />
                </DetailSection>

                <DetailSection
                  icon={<Calendar className="size-3" />}
                  title="Death Info"
                >
                  <FieldRow label="Date of Death" value={formatDate(flyoutRecord.date_of_death)} />
                  <FieldRow label="Immediate Cause" value={flyoutRecord.immediate_cause_of_death || '—'} />
                  <FieldRow label="Underlying Cause" value={flyoutRecord.underlying_cause_of_death || '—'} />
                  {flyoutRecord.underlying_cause_of_death ===
                    'Others (specify)' &&
                    flyoutRecord.underlying_cause_other && (
                      <FieldRow label="Specified Cause" value={flyoutRecord.underlying_cause_other} />
                    )}
                </DetailSection>

                <DetailSection
                  icon={<Skull className="size-3" />}
                  title="Metadata"
                >
                  <FieldRow label="Created" value={formatDateTime(flyoutRecord.created)} />
                  <FieldRow label="Updated" value={formatDateTime(flyoutRecord.updated)} />
                </DetailSection>
              </>
            )
          })()}
      </DetailPanel>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete deceased record"
        message="This action cannot be undone. The deceased record will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
