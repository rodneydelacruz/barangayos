import { getResidents } from './residents'
import { getDocuments } from './documents'
import { getBlotters } from './blotter'
import { getAssets } from './assets'
import { getVisitors } from './visitors'

// --- Demographics ---

export interface DemographicsReport {
  total: number
  byPurok: Record<string, number>
  byGender: { male: number; female: number }
  byCivilStatus: Record<string, number>
  voters: number
  senior: number
  pwd: number
  fourPs: number
  ageGroups: { under18: number; adult: number; senior: number }
}

export async function getDemographicsReport(): Promise<DemographicsReport> {
  try {
    const residents = await getResidents()
    const byPurok: Record<string, number> = {}
    const byCivilStatus: Record<string, number> = {}
    let male = 0
    let female = 0
    let voters = 0
    let seniors = 0
    let pwd = 0
    let fourPs = 0
    let under18 = 0
    let adult = 0
    let senior = 0

    for (const r of residents) {
      byPurok[r.purok] = (byPurok[r.purok] || 0) + 1
      byCivilStatus[r.civil_status] = (byCivilStatus[r.civil_status] || 0) + 1
      if (r.gender === 'male') male++
      else if (r.gender === 'female') female++
      if (r.is_voter) voters++
      if (r.is_senior) seniors++
      if (r.is_pwd) pwd++
      if (r.is_4ps) fourPs++
      if (r.age < 18) under18++
      else if (r.age >= 60) senior++
      else adult++
    }

    return {
      total: residents.length,
      byPurok,
      byGender: { male, female },
      byCivilStatus,
      voters,
      senior: seniors,
      pwd,
      fourPs,
      ageGroups: { under18, adult, senior },
    }
  } catch {
    return {
      total: 0,
      byPurok: {},
      byGender: { male: 0, female: 0 },
      byCivilStatus: {},
      voters: 0,
      senior: 0,
      pwd: 0,
      fourPs: 0,
      ageGroups: { under18: 0, adult: 0, senior: 0 },
    }
  }
}

// --- Documents ---

export interface DocumentsReport {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  todayRequests: number
}

export async function getDocumentsReport(): Promise<DocumentsReport> {
  try {
    const docs = await getDocuments()
    const byStatus: Record<string, number> = {}
    const byType: Record<string, number> = {}
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    let todayRequests = 0

    for (const d of docs) {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1
      byType[d.document_type] = (byType[d.document_type] || 0) + 1
      if (d.requested_at && d.requested_at.startsWith(todayStr)) {
        todayRequests++
      }
    }

    return {
      total: docs.length,
      byStatus,
      byType,
      todayRequests,
    }
  } catch {
    return {
      total: 0,
      byStatus: {},
      byType: {},
      todayRequests: 0,
    }
  }
}

// --- Blotter ---

export interface BlotterReport {
  total: number
  byStatus: Record<string, number>
  byIncidentType: Record<string, number>
}

export async function getBlotterReport(): Promise<BlotterReport> {
  try {
    const blotters = await getBlotters()
    const byStatus: Record<string, number> = {}
    const byIncidentType: Record<string, number> = {}

    for (const b of blotters) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1
      byIncidentType[b.incident_type] = (byIncidentType[b.incident_type] || 0) + 1
    }

    return {
      total: blotters.length,
      byStatus,
      byIncidentType,
    }
  } catch {
    return {
      total: 0,
      byStatus: {},
      byIncidentType: {},
    }
  }
}

// --- Assets ---

export interface AssetsReport {
  total: number
  byType: Record<string, number>
  byCondition: Record<string, number>
  byStatus: Record<string, number>
  totalValue: number
}

export async function getAssetsReport(): Promise<AssetsReport> {
  try {
    const assets = await getAssets()
    const byType: Record<string, number> = {}
    const byCondition: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    let totalValue = 0

    for (const a of assets) {
      byType[a.asset_type] = (byType[a.asset_type] || 0) + 1
      byCondition[a.condition] = (byCondition[a.condition] || 0) + 1
      const s = a.status ?? 'unknown'
      byStatus[s] = (byStatus[s] || 0) + 1
      totalValue += a.current_value ?? 0
    }

    return {
      total: assets.length,
      byType,
      byCondition,
      byStatus,
      totalValue,
    }
  } catch {
    return {
      total: 0,
      byType: {},
      byCondition: {},
      byStatus: {},
      totalValue: 0,
    }
  }
}

// --- Visitors ---

export interface VisitorsReport {
  total: number
  activeVisits: number
  byPurpose: Record<string, number>
}

export async function getVisitorsReport(): Promise<VisitorsReport> {
  try {
    const visitors = await getVisitors()
    const byPurpose: Record<string, number> = {}
    let activeVisits = 0

    for (const v of visitors) {
      byPurpose[v.purpose] = (byPurpose[v.purpose] || 0) + 1
      if (!v.time_out) {
        activeVisits++
      }
    }

    return {
      total: visitors.length,
      activeVisits,
      byPurpose,
    }
  } catch {
    return {
      total: 0,
      activeVisits: 0,
      byPurpose: {},
    }
  }
}

// --- Overview (composite) ---

export interface OverviewReport {
  demographics: DemographicsReport
  documents: DocumentsReport
  blotter: BlotterReport
  assets: AssetsReport
  visitors: VisitorsReport
}

export async function getOverviewReport(): Promise<OverviewReport> {
  const [demographics, documents, blotter, assets, visitors] = await Promise.all([
    getDemographicsReport(),
    getDocumentsReport(),
    getBlotterReport(),
    getAssetsReport(),
    getVisitorsReport(),
  ])

  return {
    demographics,
    documents,
    blotter,
    assets,
    visitors,
  }
}
