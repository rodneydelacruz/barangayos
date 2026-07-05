# Excel Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add styled `.xlsx` export for all 7 data collections from the Reports page, with a date range filter.

**Architecture:** A single `ExportBar` component above the existing tabs handles date range selection + all export buttons. A shared `exportWorkbook.ts` module builds the styled workbook in-browser using `exceljs` and triggers the download.

**Tech Stack:** exceljs (npm), React/TypeScript, lucide-react icons, existing `@/api/` functions.

## Global Constraints

- Use `exceljs` npm package for workbook generation (client-side)
- No backend changes — all data fetching via existing `@/api/` functions
- Follow existing UI patterns: Button, Card, Select components from `@/components/ui/`
- Gold (#C9953E) accent theme from the app's design system
- Date filtering done client-side after fetch
- Export bar collapsed by default, toggled via "▸ Export Data" heading

---

### Task 1: Install exceljs

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install exceljs**

```bash
npm install exceljs
```

- [ ] **Step 2: Verify install**

```bash
npm ls exceljs
```
Expected: shows `exceljs@4.x.x`

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | head -5
```
Expected: build succeeds (existing warnings ok)

---

### Task 2: Create export utility (`useExportWorkbook.ts`)

**Files:**
- Create: `src/features/reports/useExportWorkbook.ts`

**Interfaces:**
- Consumes: `exceljs` library, `getResidents`, `getHouseholds`, `getDocuments`, `getBlotters`, `getAssets`, `getVisitors`, `getActivities` from `@/api/`
- Produces: `exportWorkbook(collection, dateRange)` → triggers browser download

**Design:** This module exports a single async function `exportWorkbook`. It:
1. Fetches data based on collection name
2. Filters by date range
3. Builds `exceljs` workbook with styled headers, rows, auto-width columns
4. Triggers download via `Blob` + `URL.createObjectURL`

- [ ] **Step 1: Create the file with types and imports**

```typescript
import ExcelJS from 'exceljs'
import { getResidents } from '@/api/residents'
import { getHouseholds } from '@/api/households'
import { getDocuments } from '@/api/documents'
import { getBlotters } from '@/api/blotter'
import { getAssets } from '@/api/assets'
import { getVisitors } from '@/api/visitors'
import { getActivities } from '@/api/activity'

export type DateRange =
  | { preset: 'all' }
  | { preset: '7d' }
  | { preset: '30d' }
  | { preset: '90d' }
  | { preset: 'custom'; from: string; to: string }

export type ExportCollection =
  | 'residents'
  | 'households'
  | 'documents'
  | 'blotter'
  | 'assets'
  | 'visitors'
  | 'activity'

const COLLECTION_LABELS: Record<ExportCollection, string> = {
  residents: 'Residents',
  households: 'Households',
  documents: 'Documents',
  blotter: 'Blotter Records',
  assets: 'Assets',
  visitors: 'Visitors',
  activity: 'Activity Logs',
}

const DATE_FIELDS: Record<ExportCollection, string> = {
  residents: 'created',
  households: 'created',
  documents: 'requested_at',
  blotter: 'incident_date',
  assets: 'created',
  visitors: 'time_in',
  activity: 'created',
}
```

- [ ] **Step 2: Add the date range helper**

```typescript
function getDateRangeBounds(range: DateRange): { start: Date; end: Date } | null {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  if (range.preset === 'all') return null
  if (range.preset === '7d') return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end }
  if (range.preset === '30d') return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end }
  if (range.preset === '90d') return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end }
  return { start: new Date(range.from + 'T00:00:00'), end: new Date(range.to + 'T23:59:59') }
}
```

- [ ] **Step 3: Add the filter-by-date-range helper**

```typescript
function filterByDateRange<T extends Record<string, unknown>>(
  items: T[],
  field: string,
  bounds: { start: Date; end: Date } | null,
): T[] {
  if (!bounds) return items
  return items.filter((item) => {
    const val = item[field]
    if (!val || typeof val !== 'string') return false
    const d = new Date(val.replace(' ', 'T'))
    return d >= bounds.start && d <= bounds.end
  })
}
```

- [ ] **Step 4: Add the workbook styling function**

```typescript
const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFC9953E' } }
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
const ALT_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF8EE' } }
const BORDER_STYLE = { style: 'thin' as const, color: { argb: 'FFD4A853' } }
const BORDER = { top: BORDER_STYLE, left: BORDER_STYLE, bottom: BORDER_STYLE, right: BORDER_STYLE }

function applyHeaderStyle(ws: ExcelJS.Worksheet, headers: string[]) {
  const row = ws.getRow(1)
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1)
    cell.value = h
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
    cell.border = BORDER
  })
  row.height = 22
}

function applyDataRow(ws: ExcelJS.Worksheet, rowIdx: number, values: (string | number | boolean | null | undefined)[], isAlt: boolean) {
  const row = ws.getRow(rowIdx)
  values.forEach((v, i) => {
    const cell = row.getCell(i + 1)
    cell.value = v ?? ''
    if (isAlt) cell.fill = ALT_FILL
    cell.border = BORDER
    cell.alignment = { vertical: 'middle' }
  })
}

function autoFitColumns(ws: ExcelJS.Worksheet, headers: string[], data: unknown[][]) {
  headers.forEach((h, i) => {
    let maxLen = h.length
    data.forEach((row) => {
      const val = String(row[i] ?? '')
      if (val.length > maxLen) maxLen = val.length
    })
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 3, 10), 50)
  })
}
```

- [ ] **Step 5: Add fetch function for each collection**

```typescript
async function fetchCollectionData(collection: ExportCollection): Promise<Record<string, unknown>[]> {
  switch (collection) {
    case 'residents': return getResidents() as Promise<Record<string, unknown>[]>
    case 'households': return getHouseholds() as Promise<Record<string, unknown>[]>
    case 'documents': return getDocuments() as Promise<Record<string, unknown>[]>
    case 'blotter': return getBlotters() as Promise<Record<string, unknown>[]>
    case 'assets': return getAssets() as Promise<Record<string, unknown>[]>
    case 'visitors': return getVisitors() as Promise<Record<string, unknown>[]>
    case 'activity': return getActivities() as Promise<Record<string, unknown>[]>
  }
}
```

- [ ] **Step 6: Add field definitions per collection**

```typescript
interface FieldDef { key: string; label: string; format?: 'date' | 'datetime' | 'currency' }

const FIELD_DEFS: Record<ExportCollection, FieldDef[]> = {
  residents: [
    { key: 'first_name', label: 'First Name' },
    { key: 'middle_name', label: 'Middle Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'suffix', label: 'Suffix' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'birth_date', label: 'Birth Date', format: 'date' },
    { key: 'contact_number', label: 'Contact Number' },
    { key: 'civil_status', label: 'Civil Status' },
    { key: 'purok', label: 'Purok' },
    { key: 'occupation', label: 'Occupation' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'blood_type', label: 'Blood Type' },
    { key: 'is_voter', label: 'Voter' },
    { key: 'is_senior', label: 'Senior' },
    { key: 'is_pwd', label: 'PWD' },
    { key: 'is_4ps', label: '4Ps' },
    { key: 'household_id', label: 'Household ID' },
    { key: 'created', label: 'Created', format: 'datetime' },
    { key: 'updated', label: 'Updated', format: 'datetime' },
  ],
  households: [
    { key: 'household_number', label: 'Household Number' },
    { key: 'purok', label: 'Purok' },
    { key: 'head_name', label: 'Head Name' },
    { key: 'address', label: 'Address' },
    { key: 'notes', label: 'Notes' },
    { key: 'created', label: 'Created', format: 'datetime' },
    { key: 'updated', label: 'Updated', format: 'datetime' },
  ],
  documents: [
    { key: 'queue_number', label: 'Queue Number' },
    { key: 'resident_name', label: 'Resident Name' },
    { key: 'document_type', label: 'Document Type' },
    { key: 'other_document_type', label: 'Other Document Type' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status', label: 'Status' },
    { key: 'requested_at', label: 'Requested At', format: 'datetime' },
    { key: 'released_at', label: 'Released At', format: 'datetime' },
    { key: 'notes', label: 'Notes' },
    { key: 'created', label: 'Created', format: 'datetime' },
    { key: 'updated', label: 'Updated', format: 'datetime' },
  ],
  blotter: [
    { key: 'case_number', label: 'Case Number' },
    { key: 'incident_type', label: 'Incident Type' },
    { key: 'complainant_name', label: 'Complainant Name' },
    { key: 'complainant_contact', label: 'Complainant Contact' },
    { key: 'respondent_name', label: 'Respondent Name' },
    { key: 'respondent_contact', label: 'Respondent Contact' },
    { key: 'incident_date', label: 'Incident Date', format: 'date' },
    { key: 'incident_location', label: 'Incident Location' },
    { key: 'narrative', label: 'Narrative' },
    { key: 'involved_parties', label: 'Involved Parties' },
    { key: 'status', label: 'Status' },
    { key: 'action_taken', label: 'Action Taken' },
    { key: 'created', label: 'Created', format: 'datetime' },
    { key: 'updated', label: 'Updated', format: 'datetime' },
  ],
  assets: [
    { key: 'name', label: 'Name' },
    { key: 'asset_type', label: 'Asset Type' },
    { key: 'description', label: 'Description' },
    { key: 'serial_number', label: 'Serial Number' },
    { key: 'purchase_date', label: 'Purchase Date', format: 'date' },
    { key: 'purchase_cost', label: 'Purchase Cost', format: 'currency' },
    { key: 'current_value', label: 'Current Value', format: 'currency' },
    { key: 'condition', label: 'Condition' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_to', label: 'Assigned To' },
    { key: 'location', label: 'Location' },
    { key: 'notes', label: 'Notes' },
    { key: 'created', label: 'Created', format: 'datetime' },
    { key: 'updated', label: 'Updated', format: 'datetime' },
  ],
  visitors: [
    { key: 'visitor_name', label: 'Visitor Name' },
    { key: 'contact_number', label: 'Contact Number' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'person_to_visit', label: 'Person to Visit' },
    { key: 'time_in', label: 'Time In', format: 'datetime' },
    { key: 'time_out', label: 'Time Out', format: 'datetime' },
    { key: 'created', label: 'Created', format: 'datetime' },
    { key: 'updated', label: 'Updated', format: 'datetime' },
  ],
  activity: [
    { key: 'action', label: 'Action' },
    { key: 'collection', label: 'Collection' },
    { key: 'record_id', label: 'Record ID' },
    { key: 'details', label: 'Details' },
    { key: 'user', label: 'User' },
    { key: 'created', label: 'Created', format: 'datetime' },
  ],
}
```

- [ ] **Step 7: Add format helpers**

```typescript
function formatCellValue(val: unknown, field: FieldDef): string | number | boolean {
  if (val === null || val === undefined) return ''
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (field.format === 'date' && typeof val === 'string') return val.split('T')[0] || val.substring(0, 10)
  if (field.format === 'datetime' && typeof val === 'string') {
    const d = val.replace(' ', 'T')
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return val
    return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  if (field.format === 'currency' && typeof val === 'number') return val
  if (typeof val === 'number') return val
  if (typeof val === 'string') return val
  return String(val)
}
```

- [ ] **Step 8: Add the main export function**

```typescript
export async function exportWorkbook(collection: ExportCollection, dateRange: DateRange): Promise<void> {
  const bounds = getDateRangeBounds(dateRange)
  const dateField = DATE_FIELDS[collection]
  const allData = await fetchCollectionData(collection)
  const filtered = filterByDateRange(allData, dateField, bounds)

  if (filtered.length === 0) {
    window.alert('No records found for the selected period.')
    return
  }

  const fields = FIELD_DEFS[collection]
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Barangay Management System'
  const ws = wb.addWorksheet(COLLECTION_LABELS[collection])

  const records = filtered as Record<string, unknown>[]
  const dataRows = records.map((r) => fields.map((f) => formatCellValue(r[f.key], f)))
  const headers = fields.map((f) => f.label)

  ws.addRow(headers)
  applyHeaderStyle(ws, headers)

  dataRows.forEach((row, i) => {
    const rowIdx = i + 2
    ws.addRow(row)
    applyDataRow(ws, rowIdx, row, i % 2 === 1)
  })

  autoFitColumns(ws, headers, dataRows)

  const dateLabel = dateRange.preset === 'all' ? 'all-time' : dateRange.preset === 'custom' ? 'custom' : `last-${dateRange.preset}`
  const filename = `barangay-${collection}-${dateLabel}.xlsx`

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 9: Build check**

```bash
npm run build 2>&1 | head -10
```
Expected: 0 errors

---

### Task 3: Create ExportBar component

**Files:**
- Create: `src/features/reports/ExportBar.tsx`

**Interfaces:**
- Consumes: `exportWorkbook`, `DateRange`, `ExportCollection` from `./useExportWorkbook`
- Produces: A rendered UI with date range controls and export buttons

- [ ] **Step 1: Create ExportBar.tsx with full implementation**

```typescript
import { useState } from 'react'
import { ChevronDown, ChevronRight, Download, Users, Home, ClipboardList, FileText, Package, DoorOpen, Activity } from 'lucide-react'
import { exportWorkbook, type DateRange, type ExportCollection } from './useExportWorkbook'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PRESET_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
]

const EXPORT_BUTTONS: { collection: ExportCollection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { collection: 'residents', label: 'Residents', icon: Users },
  { collection: 'households', label: 'Households', icon: Home },
  { collection: 'documents', label: 'Documents', icon: ClipboardList },
  { collection: 'blotter', label: 'Blotter Records', icon: FileText },
  { collection: 'assets', label: 'Assets', icon: Package },
  { collection: 'visitors', label: 'Visitors', icon: DoorOpen },
  { collection: 'activity', label: 'Activity Logs', icon: Activity },
]

export default function ExportBar() {
  const [expanded, setExpanded] = useState(false)
  const [preset, setPreset] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState<ExportCollection | null>(null)

  function getDateRange(): DateRange {
    if (preset === 'custom') return { preset: 'custom', from: fromDate, to: toDate }
    return { preset: preset as DateRange['preset'] }
  }

  async function handleExport(collection: ExportCollection) {
    setExporting(collection)
    try {
      await exportWorkbook(collection, getDateRange())
    } catch {
      window.alert('Failed to export data. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-gold/20 bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30"
      >
        {expanded ? <ChevronDown className="size-4 text-gold" /> : <ChevronRight className="size-4 text-gold" />}
        Export Data
      </button>

      {expanded && (
        <div className="border-t border-gold/10 px-4 pb-4 pt-3 space-y-4">
          {/* Date Range */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date Range</label>
              <Select value={preset} onValueChange={setPreset} className="h-9 w-40 text-sm">
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            {preset === 'custom' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">From</label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">To</label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 text-sm" />
                </div>
              </>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2">
            {EXPORT_BUTTONS.map((btn) => {
              const Icon = btn.icon
              const isBusy = exporting === btn.collection
              return (
                <Button
                  key={btn.collection}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isBusy || (preset === 'custom' && (!fromDate || !toDate))}
                  onClick={() => handleExport(btn.collection)}
                >
                  {isBusy ? (
                    <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  {btn.label}
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | head -10
```
Expected: 0 errors

---

### Task 4: Wire ExportBar into ReportsPage

**Files:**
- Modify: `src/features/reports/ReportsPage.tsx`

- [ ] **Step 1: Add the import at the top of ReportsPage.tsx**

Find this line (around line 5-7):
```typescript
import { PageHeader } from '@/components/ui/PageHeader'
```

Add after it:
```typescript
import ExportBar from './ExportBar'
```

- [ ] **Step 2: Add ExportBar above the tab bar**

Find this section (around line 417-420):
```typescript
  return (
    <>
      <PageHeader title="Reports Dashboard" subtitle="Summary and insights across all barangay data" />

      {/* Tab bar */}
```

Change to:
```typescript
  return (
    <>
      <PageHeader title="Reports Dashboard" subtitle="Summary and insights across all barangay data" />

      <ExportBar />

      {/* Tab bar */}
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1
```
Expected: 0 errors, clean production build

---

### Task 5: Final verification

- [ ] **Step 1: Full clean build**

```bash
npm run build 2>&1
```
Expected: 0 errors. Production output in `dist/`.

- [ ] **Step 2: Verify the exports are available at build time**

Check the dist output includes the new module:
```bash
npm run build 2>&1 | Select-String "ExportBar|exportWorkbook"
```
Expected: references in build output (or no errors is sufficient)

---

## Spec Coverage

| Spec Requirement | Task |
|---|---|
| Export 7 collections from Reports page | Task 2 (data + workbook), Task 3 (UI), Task 4 (wiring) |
| Date range: All Time / 7d / 30d / 90d / Custom | Task 2 (`getDateRangeBounds`), Task 3 (date controls) |
| Styled workbook: gold headers, alternating rows, borders | Task 2 (styling helpers) |
| Export per collection: Residents, Households, Documents, Blotter, Assets, Visitors, Activity | Task 2 (FIELD_DEFS, fetchCollectionData) |
| Collapsible export bar above tabs | Task 3 (expanded state), Task 4 (placement) |
| Loading state per button | Task 3 (exporting state, spinner) |
| Alert when no records in range | Task 2 (empty check in exportWorkbook) |
| File name: `barangay-{collection}-{date-label}.xlsx` | Task 2 (filename construction) |
