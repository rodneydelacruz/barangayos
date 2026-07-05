### Task 4: Calendar API + CalendarPage

**Files:**
- Create: `src/api/calendar.ts`
- Create: `src/features/calendar/CalendarPage.tsx`

**Interfaces:**
- Consumes: `logActivity(...)` from `@/api/activity`
- Consumes: `getMeetings()`, `ApiMeeting` from `@/api/meetings` (Task 3)
- Produces: `ApiCalendarEvent`, `CalendarEventData`, `getEvents()`, `getEventsByMonth()`, `getEvent()`, `createEvent()`, `updateEvent()`, `deleteEvent()`

- [ ] **Step 1: Create calendar API**

Create `src/api/calendar.ts`:
- `CalendarEventData` interface (title, description?, event_type, start_datetime, end_datetime?, all_day?, location?, agenda_ref?, notes?)
- `ApiCalendarEvent extends RecordModel, CalendarEventData`
- `getEvents()` — `getFullList` sorted by `start_datetime`
- `getEventsByMonth(year, month)` — filter by `start_datetime >= startOfMonth && start_datetime < startOfNextMonth`
- `getEvent(id)` — `getOne`
- `createEvent(data)` — `create` + logActivity
- `updateEvent(id, data)` — `update` + logActivity
- `deleteEvent(id)` — fetch, delete, logActivity

- [ ] **Step 2: Create CalendarPage**

Create `src/features/calendar/CalendarPage.tsx`:
- Month/year header with prev/next buttons
- CSS 7-column grid calendar (Sun-Sat headers, day cells)
- Events per day shown as colored dots (color by event_type)
- Today highlighted with gold ring
- Selected day highlighted with gold bg
- Click day → right panel shows events for that day
- Event cards in right panel: type dot + label, title, time/date, location, Edit/Delete buttons (admin/staff only)
- Slide-over form: Title *, Description, Event Type *, Start datetime-local *, End datetime-local, All-day checkbox, Location, Link to Meeting dropdown (upcoming meetings from getMeetings), Notes
- All roles can view; admin/staff can CRUD
- Skeleton loading, error banner, ConfirmDialog for delete

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

Expected: builds cleanly (all API deps from Task 3 are available)

- [ ] **Step 4: Commit**

```
git add src/api/calendar.ts src/features/calendar/CalendarPage.tsx
git commit -m "feat: add Calendar API and page with CSS month grid"
```

---

