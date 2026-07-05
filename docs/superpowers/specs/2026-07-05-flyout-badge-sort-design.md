# Flyout Detail Panels, Badge Fix, & Table Sorting

## Goal
Add detail flyout panels to all table pages, fix badge text contrast in light mode, and add sort dropdowns to all table pages.

## 1. Badge Fix
- Standardize all badges to `bg-{color}-200 text-{color}-800 dark:bg-{color}-900/30 dark:text-{color}-300`
- RecordsPage exception (`bg-{color}-50 text-{color}-500`) upgraded to the standard

## 2. DetailPanel Component
Reusable slide-over panel at `src/components/ui/DetailPanel.tsx`

Props:
- `open: boolean`
- `onClose: () => void`
- `title: string`
- `onEdit?: () => void` (optional edit button in header)
- `loading?: boolean`
- `children: ReactNode`

## 3. Per-Page Flyout Content
| Page | Sections |
|------|----------|
| Assets | Asset fields, Activity history |
| Records (Blotters) | Case fields, Related docs, Activity history |
| Documents | Request fields + related blotters, Activity history |
| Households | Household fields, Member residents, Activity history |
| Visitor Logs | Visit fields, Activity history |

## 4. SortSelect Component
Reusable sort dropdown at `src/components/ui/SortSelect.tsx`

Props:
- `value: string`
- `onChange: (value: string) => void`
- `options: { value: string; label: string }[]`

Default sort is always `-id` (Recent) for all pages.

## 5. Per-Page Sort Options
| Page | Sort Options |
|------|-------------|
| Residents | `-id` (Recent), `last_name` (Name A-Z), `age` (Age) |
| Households | `-id` (Recent), `head_name` (Head Name A-Z), `household_number` (#) |
| Records | `-id` (Recent), `-incident_date` (Incident Date), `status` (Status) |
| Documents | `-id` (Recent), `queue_number` (Queue #), `status` (Status) |
| Assets | `-id` (Recent), `name` (Name A-Z), `asset_type` (Asset Type) |
| Visitor Logs | `-id` (Recent), `visitor_name` (Visitor A-Z), `-time_in` (Time In) |
