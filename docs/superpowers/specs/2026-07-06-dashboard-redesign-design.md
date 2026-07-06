# Dashboard Redesign — Barangay System

**Date:** 2026-07-06
**Status:** Approved design

## Overview

Redesign the main dashboard to serve as a warm, community-oriented landing page with cross-module KPIs, role-based task triage, and personalized Filipino-language greeting. Also add deceased tagging for citizens, lazy loading for data tables, and alphabetical default sort for resident profiles.

---

## 1. Hero — Greeting Bar

The signature element at the top of the dashboard.

### Behavior
- Time-aware greeting: "Magandang umaga" (00:00–11:59), "Magandang hapon" (12:00–17:59), "Magandang gabi" (18:00–23:59)
- Shows user's full name from `AuthUser.name`
- Current date in Filipino format (e.g., "Ika-6 ng Hulyo, 2026")
- Role badge (Admin/Staff/Viewer) with appropriate color
- 3 mini-stat pills below the greeting line showing role-relevant quick numbers (e.g., total residents, pending documents, active cases)

### Visual
- Background: gradient from `--color-barangay` (deep navy) to `--color-narra` (rich brown)
- Text: white/cream
- Greeting line uses `Outfit` at a heavier weight (or a display face if available)
- Subtle shadow for depth, existing `motion-fade-in` on mount

### Data sources
- `getCurrentUser()` for name, role
- `getResidentsSummary()` for resident count
- `getBlottersSummary()` for blotter counts
- `getDocumentsReport()` for document counts

---

## 2. KPI Grid — Barangay at a Glance

A responsive grid of stat cards pulling metrics from all modules, filtered by role.

### Cards by role

| Card | Admin | Staff | Viewer |
|------|-------|-------|--------|
| Total Residents | ✅ | ✅ | ✅ |
| Document Requests (pending) | ✅ | ✅ | ✅ |
| Blotter Cases (active) | ✅ | ✅ | ✅ |
| Visitors Today / Active Now | ✅ | ✅ | — |
| Meetings Today | ✅ | ✅ | — |
| Assets (total value) | ✅ | — | — |
| Pending Documents | ✅ | — | — |
| Settled Cases | ✅ | ✅ | — |
| Demographics snippet | — | — | ✅ |

### Layout
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` — spacious, no cramping
- Each card has gold accent bar at top (existing pattern)
- Icon + label + value + sub-metric (e.g., "3 pending")
- Skeleton loading states (existing pattern)
- Staggered entrance animation (`motion-stagger-75`)

### Data sources (all exist)
- `getResidentsSummary()`, `getDocumentsReport()`, `getBlottersSummary()`
- `getVisitorsReport()`, `getAssetsReport()`, `getDemographicsReport()`

---

## 3. "Ang Iyong mga Gawain" — Role-Based Tasks

A dedicated task triage card filtered by user role.

### Task sources by role

| Role | Tasks Shown |
|------|-------------|
| Admin | Pending document releases, blotter needing hearing schedule, pending resident approvals, flagged asset maintenance, system alerts |
| Staff | Document queue to process, new blotter to log, visitors to check out, today's calendar events |
| Viewer | "Updates" section (recently added residents, recently settled cases) — read-only |

### Task item design
- Priority indicator: 🔴 urgent (red dot), 🟡 normal (yellow), 🔵 informational (blue)
- Action title with link to relevant module page
- Brief detail line (who, when, what)
- Click navigates to the record or module

### Empty state
"Maayos ang lahat! — walang nakabinbing gawain." with checkmark icon.

### Data sources
- Poll `getDocuments()` filtered by `status: 'pending'`
- Poll `getBlotters()` filtered by `status: 'pending' | 'hearing'`
- Poll `getVisitors()` filtered by `time_out: null`
- Recent activity from `getActivities()`

---

## 4. Bottom Row — Activity + Quick Actions

Two-column layout below the task section.

### Left — Recent Activity
- Last 10 system-wide actions from `activity_logs`
- Each entry: user initial circle, action description, relative timestamp
- "View All Activity" link → `/logs/activity`

### Right — Quick Actions
- Role-contextual shortcuts:
  - Admin: New document request, New blotter, New resident, Schedule meeting
  - Staff: New blotter, New document request, Log visitor
  - Viewer: Go to reports, Browse residents
- Below actions: one "performance pill" metric (e.g., document release rate, data completeness)

---

## 5. Deceased Tag for Citizens

### What changes
- Add `is_deceased: boolean` field (default `false`) to the `residents` PocketBase collection
- Update the resident form/profile to show a toggle or badge for "Deceased"
- Display a "Deceased" badge/tag on resident list items and detail views
- Filter deceased residents out of active counts by default
- Migration: update `residents` collection schema

---

## 6. Lazy Loading for Data-Heavy Tables

Implement paginated fetching for all list views that display many records.

### Affected pages
- Blotter Records (`/records`)
- Resident Profiles (`/residents`)
- Households (`/households`)
- Document Queue (`/documents`)
- Activity Log (`/logs/activity`)
- Visitor Log (`/logs/visitors`)
- Assets (`/assets`)
- Agenda & Minutes (`/agenda`)

### Approach
- Use PocketBase's `getList(page, perPage)` instead of `getFullList()`
- Add a reusable pagination component (prev/next, page numbers, page size selector)
- Show loading skeleton when fetching a new page
- Preserve sort/filter state across page changes

---

## 7. Alphabetical Default Sort for Resident Profiles

### What changes
- Resident list page defaults to `sort: 'last_name,first_name'` instead of `-id`
- The sort select component should show "Name (A-Z)" as the default option
- When users switch to another sort, remember preference in component state

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Full rewrite with hero, KPIs, tasks, activity, quick actions |
| `src/api/residents.ts` | Add `is_deceased` to types + summary filter |
| `src/features/residents/` | Add deceased badge to list + detail |
| `src/features/residents/` | Default sort to `last_name,first_name` |
| `src/components/ui/Pagination.tsx` | New reusable pagination component |
| Multiple feature pages | Switch from `getFullList` to `getList` with pagination |
| `pocketbase/pb_migrations/` | New migration for `is_deceased` field |
