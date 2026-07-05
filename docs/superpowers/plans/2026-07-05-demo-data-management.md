# Demo Data Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Demo Data" section to System Settings allowing admins to seed ~300 realistic barangay records and erase selected collections.

**Architecture:** A utility module (`demoData.ts`) with hardcoded Filipino data arrays, seed functions using existing API create calls, and erase functions using PocketBase admin delete. A new UI card in `SystemSettings.tsx` with checkboxes, buttons, and progress display.

**Tech Stack:** React, TypeScript, PocketBase client, existing API modules (residents, households, documents, blotter, assets, visitors, meetings, agenda, calendar, activity).

## Global Constraints

- Admin-only: feature lives under `/settings` which is already gated to admin role
- Use existing API functions for seeding (not raw PB calls) so activity logs are generated
- Deterministic data: same seed every time for demo consistency
- Erase must respect delete dependency order (children before parents)
- Activity logs erase may 403 (PB rule: delete=null) — catch gracefully, don't block

---

### Task 1: Create demoData.ts with seed data arrays and logic

**Files:**
- Create: `src/features/settings/demoData.ts`

**Interfaces:**
- Produces: `AVAILABLE_COLLECTIONS`, `seedCollections(ids, onProgress)`, `eraseCollections(ids, onProgress)`

- [ ] **Write the complete demoData.ts file**

```typescript
import { createHousehold } from '@/api/households'
import { createResident } from '@/api/residents'
import { createDocument } from '@/api/documents'
import { createBlotter } from '@/api/blotter'
import { createAsset } from '@/api/assets'
import { createVisitor } from '@/api/visitors'
import { createMeeting } from '@/api/meetings'
import { createAgendaItem } from '@/api/agenda'
import { createEvent } from '@/api/calendar'
import { getClient } from '@/api/client'

export interface CollectionDef {
  id: string
  label: string
}

export const AVAILABLE_COLLECTIONS: CollectionDef[] = [
  { id: 'households', label: 'Households' },
  { id: 'residents', label: 'Residents' },
  { id: 'documents', label: 'Document Requests' },
  { id: 'blotter', label: 'Blotter Records' },
  { id: 'assets', label: 'Assets' },
  { id: 'visitors', label: 'Visitor Logs' },
  { id: 'meetings', label: 'Meetings & Agenda' },
  { id: 'calendar', label: 'Calendar Events' },
  { id: 'activity', label: 'Activity Logs' },
]

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Mendoza', 'Garcia', 'Torres',
  'Rivera', 'Dela Cruz', 'Aquino', 'Villanueva', 'Navarro', 'Magsaysay', 'Luna',
  'Ramos', 'Dizon', 'Gonzales', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez',
  'Hernandez', 'Diaz', 'Castillo', 'Francisco', 'Vargas', 'Soriano', 'David',
  'Jimenez', 'Rosario', 'Valdez', 'Aguilar', 'Macaraeg', 'Pascual', 'Domingo',
  'Tolentino', 'Advincula', 'Gatchalian', 'Lazatin',
]

const MALE_NAMES = [
  'Juan', 'Pedro', 'Jose', 'Miguel', 'Antonio', 'Francisco', 'Manuel', 'Carlos',
  'Andres', 'Felipe', 'Ramon', 'Eduardo', 'Rafael', 'Gregorio', 'Santiago',
  'Emilio', 'Diego', 'Gabriel', 'Mateo', 'Benjamin', 'Vincent', 'Luis',
  'Roberto', 'Fernando', 'Dante', 'Rogelio', 'Nestor', 'Mario', 'Alberto',
  'Rico', 'Danilo', 'Rolando', 'Edwin', 'Reynaldo', 'Arnold', 'Joey',
]

const FEMALE_NAMES = [
  'Maria', 'Juana', 'Ana', 'Rosa', 'Elena', 'Carmen', 'Teresa', 'Isabel',
  'Gloria', 'Luzviminda', 'Corazon', 'Leticia', 'Nenita', 'Lourdes', 'Josefina',
  'Rosario', 'Mercedita', 'Adelaida', 'Milagros', 'Consuelo', 'Remedios',
  'Carolina', 'Visitacion', 'Cristina', 'Margarita', 'Rosalinda', 'Editha',
  'Lydia', 'Zenaida', 'Evelyn', 'Lilia', 'Norma', 'Cynthia', 'Marilou',
]

const PUROKS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Sitio Central']

const OCCUPATIONS = [
  'Teacher', 'Farmer', 'Fisherfolk', 'Driver', 'Vendor', 'Carpenter',
  'Government Employee', 'Housewife', 'Student', 'Tricycle Driver',
  'Construction Worker', 'OFW', 'Self-Employed', 'Security Guard',
  'Health Worker', 'Barangay Tanod', 'Mechanic', 'Sari-Sari Store Owner',
]

const DOCUMENT_TYPES = [
  'barangay_clearance', 'business_permit', 'certificate_of_indigency',
  'certificate_of_residency', 'certificate_of_good_moral', 'cedula', 'other',
] as const

const DOCUMENT_PURPOSES = [
  'Employment requirement', 'School enrollment', 'Business permit application',
  'Government ID application', 'Loan application', 'Court requirement',
  'Travel requirement', 'Medical assistance',
]

const DOCUMENT_STATUSES = ['pending', 'processing', 'for_release', 'released', 'cancelled'] as const

const INCIDENT_TYPES = ['Blotter', 'Complaint', 'Dispute', 'Other'] as const

const BLOTTER_NARRATIVES = [
  'Verbal altercation between neighbors regarding property boundary line.',
  'Report of theft of livestock reported by the complainant.',
  'Heated argument over unpaid debt for agricultural supplies.',
  'Complaint about excessive noise from a neighbor\'s videoke machine past curfew hours.',
  'Dispute over right of way through a private property.',
  'Report of physical altercation at the local barangay covered court.',
  'Complaint regarding stray animals damaging crops and plants.',
  'Family feud involving siblings over inheritance of ancestral lot.',
  'Report of minor vandalism at the barangay day care center.',
  'Altercation between tricycle drivers over passenger terminal assignments.',
]

const ASSET_TYPES = ['equipment', 'furniture', 'it_equipment', 'vehicle', 'facility', 'tool', 'other'] as const

const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'] as const

const ASSET_STATUSES = ['available', 'assigned', 'disposed'] as const

const ASSET_NAMES: { name: string; type: typeof ASSET_TYPES[number] }[] = [
  { name: 'Samsung 55" LED TV', type: 'equipment' },
  { name: 'Portable Sound System', type: 'equipment' },
  { name: 'Epson L3110 Printer', type: 'it_equipment' },
  { name: 'Dell Optiplex Desktop Computer', type: 'it_equipment' },
  { name: 'HP LaserJet Printer', type: 'it_equipment' },
  { name: 'Epson LCD Projector', type: 'equipment' },
  { name: 'Steel Folding Chairs (50 pcs)', type: 'furniture' },
  { name: 'Long Conference Table', type: 'furniture' },
  { name: 'Executive Office Chair', type: 'furniture' },
  { name: 'Metal Filing Cabinet', type: 'furniture' },
  { name: 'Acer Laptop - Barangay Secretary', type: 'it_equipment' },
  { name: 'LTO Tricycle (Barangay Patrol)', type: 'vehicle' },
  { name: 'Generator Set 5kVA', type: 'equipment' },
  { name: 'Barangay Covered Court', type: 'facility' },
  { name: 'Day Care Center Building', type: 'facility' },
  { name: 'Handheld Radio (2 units)', type: 'tool' },
  { name: 'Fire Extinguisher (4 units)', type: 'tool' },
  { name: 'Megaphone / Bullhorn', type: 'tool' },
  { name: 'Water Dispenser', type: 'equipment' },
  { name: 'Ceiling Fan (6 units)', type: 'equipment' },
  { name: 'Whiteboard (3 units)', type: 'equipment' },
  { name: 'First Aid Kit', type: 'tool' },
  { name: 'Weighing Scale', type: 'tool' },
  { name: 'Municipal ID Card Printer', type: 'it_equipment' },
  { name: 'Metal Bookshelf (4 units)', type: 'furniture' },
  { name: 'Laptop Stand / Table', type: 'furniture' },
  { name: 'Smart TV Wall Mount', type: 'equipment' },
  { name: 'Desk Fan (5 units)', type: 'equipment' },
  { name: 'Barangay Patrol Jeep', type: 'vehicle' },
  { name: 'Electric Fan Standing (8 units)', type: 'equipment' },
]

const VISITOR_PURPOSES = [
  'Submit document requirement', 'Inquiry about barangay clearance',
  'Follow up on blotter case', 'Schedule council meeting',
  'Request for assistance', 'Pay fees and charges',
  'Visit the Barangay Captain', 'Complaint filing',
]

const MEETING_TYPES = ['regular', 'special', 'emergency'] as const

const MEETING_LOCATIONS = ["Barangay Hall Session Room", "Barangay Covered Court", "Barangay Day Care Center"]

const MEETING_TITLES = [
  'Monthly Barangay Council Session',
  'Peace and Order Committee Meeting',
  'Budget and Appropriations Hearing',
  'Barangay Development Planning Workshop',
  'Disaster Preparedness Briefing',
  'Health and Sanitation Committee',
  'Senior Citizens Affairs Meeting',
  'Youth Development Council Session',
  'Barangay Clean-Up Drive Planning',
  'Infrastructure Project Review',
]

const AGENDA_TOPICS = [
  'Approval of previous session minutes',
  'Report on peace and order situation',
  'Discussion on pending blotter cases',
  'Updates on infrastructure projects',
  'Barangay budget allocation for next quarter',
  'Proposed ordinance on waste management',
  'Request for additional street lights',
  'Scholarship program for deserving students',
  'Community feeding program report',
  'Road repair and maintenance plan',
  'Clean-up drive schedule and assignments',
  'Health mission coordination with LGU',
  'Disaster response equipment procurement',
  'Senior citizens monthly allowance',
  'Sports festival planning for fiesta',
]

const CALENDAR_EVENT_TYPES = ['barangay_event', 'hearing', 'council_meeting', 'holiday', 'other'] as const

const CALENDAR_EVENT_TITLES = [
  'Barangay Fiesta Celebration',
  'Flag Ceremony - Barangay Plaza',
  'Community Clean-Up Drive',
  'Medical Mission / Check-up',
  'Senior Citizens Day',
  'Barangay Assembly',
  'Kiddie Day Celebration',
  'Feast of Barangay Patron Saint',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function randomAge(min = 1, max = 90): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(startDays = 365, endDays = 0): string {
  const now = Date.now()
  const offset = Math.floor(Math.random() * startDays * 86400000)
  return new Date(now - offset).toISOString().split('T')[0]
}

function randomDateTime(startDays = 90, endDays = 0): string {
  const now = Date.now()
  const offset = Math.floor(Math.random() * startDays * 86400000) + Math.floor(Math.random() * 86400000)
  return new Date(now - offset).toISOString()
}

function capitalize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function seedCollections(
  ids: string[],
  onProgress: (msg: string) => void,
): Promise<{ total: number; errors: string[] }> {
  const errors: string[] = []
  let total = 0

  const seedSet = new Set(ids)

  // --- Households ---
  const householdIds: string[] = []
  if (seedSet.has('households')) {
    onProgress('Seeding households...')
    const headNames = [
      ...pickN(MALE_NAMES, 16).map((f) => `${f} ${pick(LAST_NAMES)}`),
      ...pickN(FEMALE_NAMES, 8).map((f) => `${f} ${pick(LAST_NAMES)}`),
    ]
    for (let i = 0; i < 24; i++) {
      try {
        const hh = await createHousehold({
          household_number: `H-${String(i + 1).padStart(4, '0')}`,
          head_name: headNames[i],
          purok: pick(PUROKS),
          address: `${pick(PUROKS)}, Barangay Poblacion`,
        })
        householdIds.push(hh.id)
        total++
      } catch (e) {
        errors.push(`Household ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  // --- Residents ---
  const residentIds: string[] = []
  if (seedSet.has('residents')) {
    onProgress('Seeding residents...')
    for (let i = 0; i < 120; i++) {
      const isMale = Math.random() > 0.5
      const firstName = isMale ? pick(MALE_NAMES) : pick(FEMALE_NAMES)
      const lastName = pick(LAST_NAMES)
      const age = randomAge(1, 90)
      const civilStatus: ('single' | 'married' | 'widowed' | 'separated')[] =
        age < 18 ? ['single'] : ['single', 'married', 'widowed', 'separated']
      const hasBirthDate = age > 0
      const birthDate = hasBirthDate
        ? new Date(Date.now() - age * 365.25 * 86400000 - Math.random() * 180 * 86400000).toISOString().split('T')[0]
        : undefined

      try {
        const res = await createResident({
          first_name: firstName,
          middle_name: Math.random() > 0.4 ? pick(LAST_NAMES) : undefined,
          last_name: lastName,
          suffix: Math.random() > 0.85 ? pick(['Jr.', 'Sr.', 'II', 'III']) : undefined,
          birth_date: birthDate,
          age,
          gender: isMale ? 'male' : 'female',
          contact_number: `09${String(Math.floor(100000000 + Math.random() * 900000000))}`,
          household_id: householdIds.length > 0 && Math.random() > 0.3
            ? pick(householdIds)
            : undefined,
          purok: pick(PUROKS),
          civil_status: pick(civilStatus),
          occupation: age > 15 ? pick(OCCUPATIONS) : undefined,
          nationality: 'Filipino',
          is_voter: age >= 18 ? Math.random() > 0.15 : false,
          is_4ps: Math.random() > 0.85,
          is_senior: age >= 60,
          is_pwd: Math.random() > 0.92,
          blood_type: pick(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        })
        residentIds.push(res.id)
        total++
      } catch (e) {
        errors.push(`Resident ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  // --- Meetings ---
  const meetingIds: string[] = []
  if (seedSet.has('meetings')) {
    onProgress('Seeding meetings...')
    for (let i = 0; i < 10; i++) {
      try {
        const meetingType = pick(MEETING_TYPES) as string
        const meetingDate = randomDate(90, 0)
        const meeting = await createMeeting({
          title: MEETING_TITLES[i % MEETING_TITLES.length],
          meeting_date: meetingDate,
          location: pick(MEETING_LOCATIONS),
          meeting_type: meetingType,
          status: meetingDate > new Date().toISOString().split('T')[0] ? 'scheduled' : 'adjourned',
        })
        meetingIds.push(meeting.id)
        total++
      } catch (e) {
        errors.push(`Meeting ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  // --- Agenda Items ---
  if (seedSet.has('meetings') && meetingIds.length > 0) {
    onProgress('Seeding agenda items...')
    for (const mid of meetingIds) {
      const topics = pickN(AGENDA_TOPICS, 3 + Math.floor(Math.random() * 3))
      for (let j = 0; j < topics.length; j++) {
        try {
          await createAgendaItem({
            meeting_id: mid,
            title: topics[j],
            description: `Discussion and action on: ${topics[j].toLowerCase()}.`,
            sort_order: j + 1,
            status: 'pending',
          })
          total++
        } catch (e) {
          errors.push(`Agenda item ${j + 1} (meeting ${mid}): ${e instanceof Error ? e.message : 'Unknown error'}`)
        }
      }
    }
  }

  // --- Calendar Events ---
  if (seedSet.has('calendar')) {
    onProgress('Seeding calendar events...')
    for (let i = 0; i < 16; i++) {
      try {
        const eventType = pick(CALENDAR_EVENT_TYPES) as string
        const startDate = randomDate(60, -30)
        await createEvent({
          title: CALENDAR_EVENT_TITLES[i % CALENDAR_EVENT_TITLES.length],
          description: `Annual ${CALENDAR_EVENT_TITLES[i % CALENDAR_EVENT_TITLES.length].toLowerCase()} organized by the barangay council.`,
          event_type: eventType,
          start_datetime: startDate + 'T09:00:00.000Z',
          end_datetime: startDate + 'T17:00:00.000Z',
          all_day: Math.random() > 0.7,
          location: pick(MEETING_LOCATIONS),
          agenda_ref: meetingIds.length > 0 && Math.random() > 0.6 ? pick(meetingIds) : undefined,
        })
        total++
      } catch (e) {
        errors.push(`Calendar Event ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  // --- Document Requests ---
  if (seedSet.has('documents')) {
    onProgress('Seeding document requests...')
    for (let i = 0; i < 50; i++) {
      try {
        await createDocument({
          resident_id: residentIds.length > 0 ? pick(residentIds) : undefined,
          resident_name: `${pick(MALE_NAMES)} ${pick(LAST_NAMES)}`,
          document_type: pick(DOCUMENT_TYPES) as string,
          purpose: pick(DOCUMENT_PURPOSES),
          status: pick(DOCUMENT_STATUSES) as string,
        })
        total++
      } catch (e) {
        errors.push(`Document ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  // --- Blotter Records ---
  if (seedSet.has('blotter')) {
    onProgress('Seeding blotter records...')
    const blotterStatuses = ['pending', 'hearing', 'settled', 'escalated', 'dismissed'] as const
    for (let i = 0; i < 20; i++) {
      try {
        await createBlotter({
          case_number: `BLT-2026-${String(i + 1).padStart(3, '0')}`,
          incident_type: pick(INCIDENT_TYPES) as string,
          complainant_name: `${pick(MALE_NAMES)} ${pick(LAST_NAMES)}`,
          complainant_contact: `09${String(Math.floor(100000000 + Math.random() * 900000000))}`,
          respondent_name: Math.random() > 0.3 ? `${pick(MALE_NAMES)} ${pick(LAST_NAMES)}` : undefined,
          respondent_contact: Math.random() > 0.3 ? `09${String(Math.floor(100000000 + Math.random() * 900000000))}` : undefined,
          incident_date: randomDate(180, 0),
          incident_location: pick(PUROKS) + ', Barangay Poblacion',
          narrative: pick(BLOTTER_NARRATIVES),
          status: pick(blotterStatuses) as string,
          action_taken: Math.random() > 0.4 ? pick(['Mediation conducted', 'Parties reconciled', 'Referred to LGU', 'Under investigation', 'Case dismissed']) : undefined,
          involved_parties: Math.random() > 0.5 ? 'Neighbors, Barangay Tanod, Barangay Captain' : undefined,
        })
        total++
      } catch (e) {
        errors.push(`Blotter ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  // --- Assets ---
  if (seedSet.has('assets')) {
    onProgress('Seeding assets...')
    for (let i = 0; i < ASSET_NAMES.length; i++) {
      try {
        const asset = ASSET_NAMES[i]
        await createAsset({
          name: asset.name,
          asset_type: asset.type,
          description: `${asset.name} — property of Barangay Poblacion.`,
          serial_number: Math.random() > 0.3 ? `SN-BRGY-${String(i + 1).padStart(4, '0')}` : undefined,
          purchase_date: randomDate(1460, 0),
          purchase_cost: Math.floor(500 + Math.random() * 150000),
          current_value: Math.floor(200 + Math.random() * 100000),
          condition: pick(ASSET_CONDITIONS) as string,
          status: pick(ASSET_STATUSES) as string,
          location: pick(MEETING_LOCATIONS),
        })
        total++
      } catch (e) {
        errors.push(`Asset ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  // --- Visitor Logs ---
  if (seedSet.has('visitors')) {
    onProgress('Seeding visitor logs...')
    for (let i = 0; i < 40; i++) {
      try {
        const checkedOut = Math.random() > 0.25
        await createVisitor({
          visitor_name: `${Math.random() > 0.5 ? pick(MALE_NAMES) : pick(FEMALE_NAMES)} ${pick(LAST_NAMES)}`,
          contact_number: `09${String(Math.floor(100000000 + Math.random() * 900000000))}`,
          purpose: pick(VISITOR_PURPOSES),
          person_to_visit: Math.random() > 0.3 ? `Barangay ${pick(['Captain', 'Secretary', 'Treasurer', 'Tanod'])}` : undefined,
          time_out: checkedOut ? randomDateTime(30, 0) : undefined,
        })
        total++
      } catch (e) {
        errors.push(`Visitor ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  return { total, errors }
}

const ERASE_ORDER: { id: string; collection: string }[] = [
  { id: 'activity', collection: 'activity_logs' },
  { id: 'calendar', collection: 'calendar_events' },
  { id: 'documents', collection: 'document_requests' },
  { id: 'visitors', collection: 'visitor_logs' },
  { id: 'blotter', collection: 'blotter_records' },
  { id: 'assets', collection: 'assets' },
  { id: 'residents', collection: 'residents' },
  { id: 'meetings', collection: 'agenda_items' },
  { id: 'meetings', collection: 'meetings' },
  { id: 'households', collection: 'households' },
]

export async function eraseCollections(
  ids: string[],
  onProgress: (msg: string) => void,
): Promise<{ total: number; errors: string[] }> {
  const errors: string[] = []
  let total = 0
  const eraseSet = new Set(ids)
  const pb = getClient()

  for (const { id, collection } of ERASE_ORDER) {
    if (!eraseSet.has(id)) continue
    const label = capitalize(collection)
    onProgress(`Erasing ${label}...`)

    try {
      const records = await pb.collection(collection).getFullList<{ id: string }>({ requestKey: null })
      for (const record of records) {
        try {
          await pb.collection(collection).delete(record.id, { requestKey: null })
          total++
        } catch {
          // individual delete failure — skip (may be 403 for activity_logs)
        }
      }
    } catch (e) {
      errors.push(`${label}: ${e instanceof Error ? e.message : 'Failed to list records'}`)
    }
  }

  return { total, errors }
}
```

- [ ] **Verify imports compile**

Run: `npx tsc --noEmit src/features/settings/demoData.ts 2>&1`
Expected: No type errors (or minimal if deps not yet installed)

---

### Task 2: Add Demo Data card to SystemSettings.tsx

**Files:**
- Modify: `src/features/settings/SystemSettings.tsx`

**Interface:**
- Consumes: `AVAILABLE_COLLECTIONS`, `seedCollections(ids, onProgress)`, `eraseCollections(ids, onProgress)` from `./demoData`

- [ ] **Add import and state to SystemSettings.tsx**

Add this import among existing imports (after line 7):

```typescript
import { AVAILABLE_COLLECTIONS, seedCollections, eraseCollections, type CollectionDef } from './demoData'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Database, Trash2, Loader2 } from 'lucide-react'
```

Add state after the existing state declarations (after line 132):

```typescript
const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set(AVAILABLE_COLLECTIONS.map((c) => c.id)))
const [seeding, setSeeding] = useState(false)
const [erasing, setErasing] = useState(false)
const [showEraseConfirm, setShowEraseConfirm] = useState(false)
const [progress, setProgress] = useState<string[]>([])
```

- [ ] **Add toggle handler and check all handler**

Add before the `if (loading)` guard at line 237:

```typescript
function toggleCollection(id: string) {
  setSelectedCollections((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
}

function toggleAll() {
  if (selectedCollections.size === AVAILABLE_COLLECTIONS.length) {
    setSelectedCollections(new Set())
  } else {
    setSelectedCollections(new Set(AVAILABLE_COLLECTIONS.map((c) => c.id)))
  }
}

function addProgress(msg: string) {
  setProgress((prev) => [...prev, msg])
}

async function handleSeed() {
  const ids = [...selectedCollections]
  if (ids.length === 0) { window.alert('Select at least one collection.'); return }
  setSeeding(true)
  setProgress([])
  const result = await seedCollections(ids, addProgress)
  addProgress(`Done! ${result.total} records created.`)
  if (result.errors.length > 0) {
    addProgress(`Errors: ${result.errors.length}`)
    result.errors.slice(0, 5).forEach((e) => addProgress(`  - ${e}`))
  }
  setSeeding(false)
}

async function handleErase() {
  setShowEraseConfirm(false)
  const ids = [...selectedCollections]
  setErasing(true)
  setProgress([])
  const result = await eraseCollections(ids, addProgress)
  addProgress(`Done! ${result.total} records deleted.`)
  if (result.errors.length > 0) {
    addProgress(`Errors: ${result.errors.length}`)
    result.errors.slice(0, 5).forEach((e) => addProgress(`  - ${e}`))
  }
  setErasing(false)
}
```

- [ ] **Add the Demo Data section card before the closing `</div>` of the main content (before line 345)**

After line 344 (closing `</section>` for Incident Types), add:

```typescript
        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <Database className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Demo Data Management
            </h2>
          </div>
          <div className="p-3 space-y-3">
            <p className="text-[11px] text-muted-foreground/60">
              Populate the system with realistic sample data for testing and demonstrations, or erase existing records to start fresh.
            </p>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-gold hover:text-gold/80 transition-colors"
              >
                {selectedCollections.size === AVAILABLE_COLLECTIONS.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-[11px] text-muted-foreground/50">
                {selectedCollections.size} / {AVAILABLE_COLLECTIONS.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {AVAILABLE_COLLECTIONS.map((c) => {
                const checked = selectedCollections.has(c.id)
                return (
                  <label
                    key={c.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer transition-colors',
                      checked
                        ? 'border-gold/50 bg-gold/5'
                        : 'border-input bg-background hover:bg-accent',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCollection(c.id)}
                      className="size-3.5 rounded border-input text-gold focus:ring-gold/30 focus:ring-offset-0"
                    />
                    {c.label}
                  </label>
                )
              })}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSeed}
                disabled={seeding || erasing || selectedCollections.size === 0}
                className="gap-1.5"
              >
                {seeding ? <Loader2 className="size-3.5 animate-spin" /> : <Database className="size-3.5" />}
                {seeding ? 'Seeding...' : 'Seed Demo Data'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowEraseConfirm(true)}
                disabled={seeding || erasing || selectedCollections.size === 0}
                className="gap-1.5"
              >
                {erasing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                {erasing ? 'Erasing...' : 'Erase Selected'}
              </Button>
            </div>

            {progress.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-md border border-input bg-muted/30 p-2 space-y-0.5">
                {progress.map((msg, i) => (
                  <p key={i} className={cn(
                    'text-[11px] font-mono leading-relaxed',
                    msg.startsWith('Done!') ? 'text-emerald-600 dark:text-emerald-400' :
                    msg.startsWith('Error') || msg.startsWith('  - ') ? 'text-destructive' :
                    'text-muted-foreground/80',
                  )}>
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        <ConfirmDialog
          open={showEraseConfirm}
          title="Erase selected data?"
          message={`This will permanently delete all records from ${selectedCollections.size} selected collection(s). This action cannot be undone.`}
          confirmLabel="Erase Everything"
          destructive
          loading={erasing}
          onConfirm={handleErase}
          onCancel={() => setShowEraseConfirm(false)}
        />
```

- [ ] **Run build to verify**

Run: `npm run build 2>&1`
Expected: No TypeScript errors, build succeeds
