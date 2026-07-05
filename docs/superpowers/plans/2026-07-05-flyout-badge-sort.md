# Flyout/Badge/Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution.

**Goal:** Add detail flyout panels to all table pages, fix badge contrast on light mode, add sort dropdowns.

**Architecture:** Reusable `DetailPanel` and `SortSelect` components; each page wires its own data fetching and sections.

**Tech Stack:** React 19, Tailwind CSS, lucide-react, PocketBase SDK

## Global Constraints
- Use existing `cn()` utility from `@/lib/utils` for conditional classes
- Use `lucide-react` icons for section headers
- Follow the flyout pattern from `ResidentsPage.tsx` (z-40, max-w-lg, backdrop)
- Use `formatDate`/`formatDateTime` from `@/lib/utils` for date formatting
- Sort param is sent as `sort` to PocketBase API calls

---
### Task 1: Badge Contrast Fix

**Files:**
- Modify: `src/features/records/RecordsPage.tsx` (badge color map)
- Modify: all other files with badge color maps (search pattern)

Change all badge `bg-{color}-100` → `bg-{color}-200` and `text-{color}-700` → `text-{color}-800`.
Change RecordsPage from `bg-{color}-50 text-{color}-500` to `bg-{color}-200 text-{color}-800`.

- [ ] **Update RecordsPage** blotter status colors
- [ ] **Update all other badge maps** across AssetsPage, DocumentsPage, ResidentsPage, HouseholdsPage, AgendaPage, ActivityPage, VisitorLogPage
- [ ] **Verify build**
- [ ] **Commit**

### Task 2: DetailPanel Component

**Files:**
- Create: `src/components/ui/DetailPanel.tsx`
- Modify: `src/features/residents/ResidentsPage.tsx` (use DetailPanel)

- [ ] Create `DetailPanel` with backdrop, slide-over, header (title + edit + close), loading skeleton, children slot
- [ ] Refactor ResidentsPage to use DetailPanel instead of inline flyout
- [ ] Verify build
- [ ] Commit

### Task 3: SortSelect Component

**Files:**
- Create: `src/components/ui/SortSelect.tsx`

- [ ] Create `SortSelect` with dropdown of predefined options, direction toggle button
- [ ] Verify build
- [ ] Commit

### Task 4: AssetsPage Flyout & Sort

**Files:**
- Modify: `src/features/assets/AssetsPage.tsx`

- [ ] Add flyout open/close state + `openAssetFlyout()` function
- [ ] Wire DetailPanel with asset fields and activity history
- [ ] Add SortSelect with Recent/Name/AssetType options
- [ ] Apply sort to `getAssets()` call
- [ ] Verify build
- [ ] Commit

### Task 5: RecordsPage Flyout & Sort

**Files:**
- Modify: `src/features/records/RecordsPage.tsx`

- [ ] Add flyout open/close state + `openRecordFlyout()` function
- [ ] Wire DetailPanel with blotter fields, related documents, activity history
- [ ] Add SortSelect with Recent/IncidentDate/Status options
- [ ] Apply sort to blotter fetch
- [ ] Verify build
- [ ] Commit

### Task 6: DocumentsPage Flyout & Sort

**Files:**
- Modify: `src/features/documents/DocumentsPage.tsx`

- [ ] Add flyout open/close state + `openDocFlyout()` function
- [ ] Wire DetailPanel with document fields, related blotters, activity history
- [ ] Add SortSelect with Recent/Queue/Status options
- [ ] Apply sort to document fetch
- [ ] Verify build
- [ ] Commit

### Task 7: HouseholdsPage Flyout & Sort

**Files:**
- Modify: `src/features/households/HouseholdsPage.tsx`

- [ ] Add flyout open/close state + `openHouseholdFlyout()` function
- [ ] Wire DetailPanel with household fields, member residents, activity history
- [ ] Add SortSelect with Recent/HeadName/HouseholdNumber options
- [ ] Apply sort to household fetch
- [ ] Verify build
- [ ] Commit

### Task 8: VisitorLogPage Flyout & Sort

**Files:**
- Modify: `src/features/logs/VisitorLogPage.tsx`

- [ ] Add flyout open/close state + `openVisitorFlyout()` function
- [ ] Wire DetailPanel with visitor fields and activity history
- [ ] Add SortSelect with Recent/VisitorName/TimeIn options
- [ ] Apply sort to visitor fetch
- [ ] Verify build
- [ ] Commit
