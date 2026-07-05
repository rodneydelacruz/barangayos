# Task 6: Dashboard update — Report

## What was implemented
Updated `src/pages/Dashboard.tsx` to use blotter API instead of the deleted records API:
- Imports: replaced `@/api/records` with `@/api/blotter` (`getBlotters`, `getBlottersSummary`, `ApiBlotter`)
- State: changed stats shape to `{ total, pending, hearing, settled, escalated, dismissed }`
- Data fetching: calls `getBlottersSummary()` and `getBlotters()` instead of records equivalents
- Stat cards: Hearing (blue) and Settled (emerald) replace Approved/Rejected
- `statusConfig`: updated with hearing, settled, escalated, dismissed statuses
- Recent records: displays `case_number — complainant_name` instead of `title`
- Quick Actions: buttons renamed to "New Blotter Case" and "View All Cases"
- Added `Scale`, `ArrowUpCircle` to lucide-react import

## Build result
**PASS** — `tsc -b && vite build` completed successfully with no errors.

## Files changed
- `src/pages/Dashboard.tsx` (modified)
