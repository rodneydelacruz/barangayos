### Task 5: AgendaPage — Meetings + Agenda Items UI

**Files:**
- Create: `src/features/agenda/AgendaPage.tsx`

**Interfaces:**
- Consumes: all exports from `@/api/meetings` (Task 3) and `@/api/agenda` (Task 3)
- Consumes: `hasRole()` from `@/auth/session`

- [ ] **Step 1: Create AgendaPage**

Create `src/features/agenda/AgendaPage.tsx` with two views:

**Meetings list view (default):**
- Table: Title, Date, Type badge (regular/special/emergency with color), Status badge (scheduled/ongoing/adjourned), Items count, Minutes status, Actions
- Filters: search by title, status dropdown
- Click row → detail view
- "New Meeting" button opens slide-over form
- Slide-over form: Title *, Date *, Location, Type dropdown, Status dropdown, Notes

**Meeting detail view:**
- Header: meeting title, date, type badge, status badge, location
- Back button → list
- Edit Meeting button, Add Item button
- Notes section (if any)
- Agenda items table: #, Title (+ description), Status badge, Minutes (truncated preview or "Pending meeting" / "Fill minutes"), Actions (Edit/Delete)
- Click item → slide-over form for agenda item
- Item form: Title *, Description, Sort Order, Status dropdown, Minutes textarea (shown only if meeting status is not 'scheduled')
- `submitted_by` auto-set from authStore on first minutes save
- ConfirmDialog for delete

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

Expected: builds cleanly

- [ ] **Step 3: Commit**

```
git add src/features/agenda/AgendaPage.tsx
git commit -m "feat: add Agenda & Minutes page with meetings list and detail view"
```

---

