# Excel Export for Reports Dashboard

## Overview

Add styled spreadsheet (`.xlsx`) export to all 7 data collections from the Reports page. The exports are used for LGU reporting — each file contains full individual records from the selected collection, filtered by an optional date range.

## Layout

A collapsible export bar sits above the existing tab bar on the Reports page:

```
┌─────────────────────────────────────────────────────────────┐
│  ▸ Export Data  [▼ Last 30 Days]  From [____]  To [____]   │
│                                                             │
│  [Residents] [Households] [Documents] [Blotter] [Assets]   │
│  [Visitors]  [Activity Logs]                                │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Demographics] [Documents] [Blotter] [Assets]   │
│  [Visitors] — existing tabs                                 │
└─────────────────────────────────────────────────────────────┘
```

The export bar is collapsed by default with a toggle heading "▸ Export Data".

## Date Range Filter

A single date range control applies to all 7 export buttons:

| Control | Behavior |
|---|---|
| Preset dropdown | Options: `All Time`, `Last 7 Days`, `Last 30 Days`, `Last 90 Days`, `Custom Range` |
| From / To inputs | Visible only when `Custom Range` is selected. Native date inputs. |
| Default | `All Time` (no date filter applied) |

**How date filtering works per collection:**

| Collection | Date field used for filtering |
|---|---|
| Residents | `created` |
| Households | `created` |
| Documents | `requested_at` |
| Blotter | `incident_date` |
| Assets | `created` (or `purchase_date` if set) |
| Visitors | `time_in` |
| Activity Logs | `created` |

Records where the date field falls within the range are included. If no date field matches (unset), the record is excluded only when a date range is active.

## Export Buttons — 7 Collections

### Data Per Collection

| Button | Fields Exported |
|---|---|
| **Residents** | First Name, Middle Name, Last Name, Suffix, Age, Gender, Birth Date, Contact Number, Civil Status, Purok, Occupation, Nationality, Blood Type, Voter (Yes/No), Senior (Yes/No), PWD (Yes/No), 4Ps (Yes/No), Household ID, Created, Updated |
| **Households** | Household Number, Purok, Head Name, Address, Notes, Created, Updated |
| **Documents** | Queue Number, Resident Name, Document Type, Other Document Type, Purpose, Status, Requested At, Released At, Notes, Created, Updated |
| **Blotter (Records)** | Case Number, Incident Type, Complainant Name, Complainant Contact, Respondent Name, Respondent Contact, Incident Date, Incident Location, Narrative, Involved Parties, Status, Action Taken, Created, Updated |
| **Assets** | Name, Asset Type, Description, Serial Number, Purchase Date, Purchase Cost, Current Value, Condition, Status, Assigned To, Location, Notes, Created, Updated |
| **Visitors** | Visitor Name, Contact Number, Purpose, Person To Visit, Time In, Time Out, Created, Updated |
| **Activity Logs** | Action, Collection, Record ID, Details, User, Created |

### File Format

- **File name**: `barangay-{collection}-{date-label}.xlsx`  
  e.g. `barangay-residents-last-30-days.xlsx`, `barangay-documents-all-time.xlsx`
- **Sheet name**: Collection label (e.g. `Residents`, `Documents`, `Blotter Records`)

## Styling

| Element | Style |
|---|---|
| **Header row fill** | Gold `#C9953E` |
| **Header font** | White `#FFFFFF`, bold, 11pt |
| **Data row fill (even)** | White `#FFFFFF` |
| **Data row fill (odd)** | Light gold `#FFF8EE` |
| **Borders** | Thin, gold-tinted `#D4A853` |
| **Column widths** | Auto-fitted to content (max 50 chars) |
| **Date columns** | Format `YYYY-MM-DD` or `YYYY-MM-DD HH:MM` for datetime |
| **Text alignment** | Left-aligned header/data, numbers/currency right-aligned |

## Technical Approach

### Library
- **`exceljs`** — npm package with rich styling API (colors, borders, fonts, alignment, column widths)

### Data Fetching
- Reuse existing API functions from `@/api/` (e.g., `getResidents()`, `getHouseholds()`, etc.)
- No new API endpoints needed
- Date filtering done client-side after fetching

### Component
- New component: `src/features/reports/ExportBar.tsx`
  - Contains date range controls + export buttons
  - Uses `exceljs` to generate and download `.xlsx`
- Modified: `src/features/reports/ReportsPage.tsx`
  - Imports and renders `<ExportBar />` above the tabs

### Architecture

```
ReportsPage.tsx
├── ExportBar.tsx (new)
│   ├── DateRangeSelect (preset dropdown + conditional from/to inputs)
│   ├── ExportButton × 7 (one per collection)
│   └── useExcelExport.ts (export logic — fetch data, build workbook, download)
└── (existing tab content)
```

### Export Flow

1. User selects date range
2. User clicks e.g. "Export Residents"
3. Loading state shown on button
4. Fetch data via API function + filter by date range
5. Build workbook with `exceljs`:
   - Create worksheet
   - Write header row with styling
   - Write data rows with alternating fills
   - Auto-fit column widths
6. Generate buffer → create Blob → trigger download
7. Reset button loading state

## Implementation Plan

1. Install `exceljs` npm dependency
2. Create `src/features/reports/useExcelExport.ts` — shared export logic (workbook builder, download helper)
3. Create `src/features/reports/ExportBar.tsx` — UI: date range + 7 export buttons
4. Update `src/features/reports/ReportsPage.tsx` — render ExportBar above tabs
5. Test build

## Edge Cases

- **No records in range**: Show a simple alert/toast "No records found for the selected period" instead of generating an empty file
- **Loading state**: Each export button shows a spinner/disabled state while generating
- **Large datasets**: `exceljs` streams to buffer; for 1000+ rows the auto-fit applies reasonable max widths
- **Date field null/missing**: Record excluded from export if the date field is null and range is active
