import ExcelJS from 'exceljs'
import { getResidents } from '@/api/residents'
import { getHouseholds } from '@/api/households'
import { getDocuments } from '@/api/documents'
import { getBlotters } from '@/api/blotter'
import { getAssets } from '@/api/assets'
import { getVisitors } from '@/api/visitors'
import { getActivities } from '@/api/activity'
import { toast } from '@/lib/toast'

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

function getDateRangeBounds(range: DateRange): { start: Date; end: Date } | null {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  if (range.preset === 'all') return null
  if (range.preset === '7d') return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end }
  if (range.preset === '30d') return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end }
  if (range.preset === '90d') return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end }
  return { start: new Date(range.from + 'T00:00:00'), end: new Date(range.to + 'T23:59:59') }
}

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

async function fetchCollectionData(collection: ExportCollection): Promise<Record<string, unknown>[]> {
  switch (collection) {
    case 'residents': return getResidents() as Promise<Record<string, unknown>[]>
    case 'households': return getHouseholds() as Promise<Record<string, unknown>[]>
    case 'documents': return getDocuments() as Promise<Record<string, unknown>[]>
    case 'blotter': return getBlotters() as Promise<Record<string, unknown>[]>
    case 'assets': return getAssets() as Promise<Record<string, unknown>[]>
    case 'visitors': return getVisitors() as Promise<Record<string, unknown>[]>
    case 'activity': return getActivities().then((r) => r.items as unknown as Record<string, unknown>[])
  }
}

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

export async function exportWorkbook(collection: ExportCollection, dateRange: DateRange): Promise<void> {
  const bounds = getDateRangeBounds(dateRange)
  const dateField = DATE_FIELDS[collection]
  const allData = await fetchCollectionData(collection)
  const filtered = filterByDateRange(allData, dateField, bounds)

  if (filtered.length === 0) {
    toast.info('No records found for the selected period.')
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
