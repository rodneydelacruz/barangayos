import { createHousehold, getNextHouseholdNumber } from '@/api/households'
import { createResident } from '@/api/residents'
import { createDocument } from '@/api/documents'
import { createBlotter, getNextCaseNumber } from '@/api/blotter'
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

const INCIDENT_TYPES = ['blotter', 'complaint', 'dispute', 'other'] as const

const BLOTTER_NARRATIVES = [
  'Verbal altercation between neighbors regarding property boundary line.',
  'Report of theft of livestock reported by the complainant.',
  'Heated argument over unpaid debt for agricultural supplies.',
  "Complaint about excessive noise from a neighbor's videoke machine past curfew hours.",
  'Dispute over right of way through a private property.',
  'Report of physical altercation at the local barangay covered court.',
  'Complaint regarding stray animals damaging crops and plants.',
  'Family feud involving siblings over inheritance of ancestral lot.',
  'Report of minor vandalism at the barangay day care center.',
  'Altercation between tricycle drivers over passenger terminal assignments.',
]

const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'] as const

const ASSET_STATUSES = ['available', 'assigned', 'disposed'] as const

const ASSET_NAMES: { name: string; type: string }[] = [
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

const MEETING_LOCATIONS = ['Barangay Hall Session Room', 'Barangay Covered Court', 'Barangay Day Care Center']

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

function randomDate(startDays = 365): string {
  const now = Date.now()
  const offset = Math.floor(Math.random() * startDays * 86400000)
  return new Date(now - offset).toISOString().split('T')[0]
}

function randomDateTime(startDays = 90): string {
  const now = Date.now()
  const offset = Math.floor(Math.random() * startDays * 86400000) + Math.floor(Math.random() * 86400000)
  return new Date(now - offset).toISOString()
}

function capitalize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function extractError(e: unknown): string {
  if (e instanceof Error && 'original' in e) {
    const orig = (e as any).original
    if (orig?.data?.message) return orig.data.message
    if (orig?.data?.data) {
      const fields = Object.entries(orig.data.data)
      return fields.map(([k, v]: [string, any]) => `${k}: ${v?.message ?? v?.code ?? ''}`).join(', ')
    }
  }
  return extractError(e)
}

export async function seedCollections(
  ids: string[],
  onProgress: (msg: string) => void,
): Promise<{ total: number; errors: string[] }> {
  const errors: string[] = []
  let total = 0
  const seedSet = new Set(ids)

  const householdIds: string[] = []
  if (seedSet.has('households')) {
    onProgress('Seeding households...')
    const headNames = [
      ...pickN(MALE_NAMES, 16).map((f) => `${f} ${pick(LAST_NAMES)}`),
      ...pickN(FEMALE_NAMES, 8).map((f) => `${f} ${pick(LAST_NAMES)}`),
    ]
    for (let i = 0; i < 24; i++) {
      try {
        const hhNumber = await getNextHouseholdNumber()
        const hh = await createHousehold({
          household_number: hhNumber,
          head_name: headNames[i],
          purok: pick(PUROKS),
          address: `${pick(PUROKS)}, Barangay Poblacion`,
        })
        householdIds.push(hh.id)
        total++
      } catch (e) {
        errors.push(`Household ${i + 1}: ${extractError(e)}`)
      }
    }
  }

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
      const birthDate = age > 0
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
        errors.push(`Resident ${i + 1}: ${extractError(e)}`)
      }
    }
  }

  const meetingIds: string[] = []
  if (seedSet.has('meetings')) {
    onProgress('Seeding meetings...')
    for (let i = 0; i < 10; i++) {
      try {
        const meetingType = pick(MEETING_TYPES) as string
        const meetingDate = randomDate(90)
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
        errors.push(`Meeting ${i + 1}: ${extractError(e)}`)
      }
    }
  }

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
          errors.push(`Agenda item ${j + 1} (meeting ${mid}): ${extractError(e)}`)
        }
      }
    }
  }

  if (seedSet.has('calendar')) {
    onProgress('Seeding calendar events...')
    for (let i = 0; i < 16; i++) {
      try {
        const eventType = pick(CALENDAR_EVENT_TYPES) as string
        const startDate = randomDate(60)
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
        errors.push(`Calendar Event ${i + 1}: ${extractError(e)}`)
      }
    }
  }

  if (seedSet.has('documents') && residentIds.length > 0) {
    onProgress('Seeding document requests...')
    for (let i = 0; i < 50; i++) {
      try {
        await createDocument({
          queue_number: String(i + 1).padStart(3, '0'),
          resident_id: pick(residentIds),
          resident_name: `${pick(MALE_NAMES)} ${pick(LAST_NAMES)}`,
          document_type: pick(DOCUMENT_TYPES) as string,
          purpose: pick(DOCUMENT_PURPOSES),
          status: pick(DOCUMENT_STATUSES) as string,
        })
        total++
      } catch (e) {
        errors.push(`Document ${i + 1}: ${extractError(e)}`)
      }
    }
  }

  if (seedSet.has('blotter')) {
    onProgress('Seeding blotter records...')
    const blotterStatuses = ['pending', 'hearing', 'settled', 'escalated', 'dismissed'] as const
    for (let i = 0; i < 20; i++) {
      try {
        const caseNumber = await getNextCaseNumber()
        await createBlotter({
          case_number: caseNumber,
          incident_type: pick(INCIDENT_TYPES) as string,
          complainant_name: `${pick(MALE_NAMES)} ${pick(LAST_NAMES)}`,
          complainant_contact: `09${String(Math.floor(100000000 + Math.random() * 900000000))}`,
          respondent_name: Math.random() > 0.3 ? `${pick(MALE_NAMES)} ${pick(LAST_NAMES)}` : undefined,
          respondent_contact: Math.random() > 0.3 ? `09${String(Math.floor(100000000 + Math.random() * 900000000))}` : undefined,
          incident_date: randomDate(180),
          incident_location: pick(PUROKS) + ', Barangay Poblacion',
          narrative: pick(BLOTTER_NARRATIVES),
          status: pick(blotterStatuses) as string,
          action_taken: Math.random() > 0.4 ? pick(['Mediation conducted', 'Parties reconciled', 'Referred to LGU', 'Under investigation', 'Case dismissed']) : undefined,
          involved_parties: Math.random() > 0.5 ? 'Neighbors, Barangay Tanod, Barangay Captain' : undefined,
        })
        total++
      } catch (e) {
        errors.push(`Blotter ${i + 1}: ${extractError(e)}`)
      }
    }
  }

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
          purchase_date: randomDate(1460),
          purchase_cost: Math.floor(500 + Math.random() * 150000),
          current_value: Math.floor(200 + Math.random() * 100000),
          condition: pick(ASSET_CONDITIONS) as string,
          status: pick(ASSET_STATUSES) as string,
          location: pick(MEETING_LOCATIONS),
        })
        total++
      } catch (e) {
        errors.push(`Asset ${i + 1}: ${extractError(e)}`)
      }
    }
  }

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
          time_out: checkedOut ? randomDateTime(30) : undefined,
        })
        total++
      } catch (e) {
        errors.push(`Visitor ${i + 1}: ${extractError(e)}`)
      }
    }
  }

  return { total, errors }
}

export async function eraseCollections(
  ids: string[],
  onProgress: (msg: string) => void,
): Promise<{ total: number; errors: string[] }> {
  const errors: string[] = []
  let total = 0
  const eraseSet = new Set(ids)
  const pb = getClient()

  const eraseOrder: { id: string; collection: string }[] = [
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

  for (const { id, collection } of eraseOrder) {
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
