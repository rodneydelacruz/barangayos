import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { logActivity } from './activity'
import type { PaginatedResult } from '@/lib/utils'

const COLLECTION = 'blotter_records'

export interface BlotterData {
  case_number?: string
  incident_type: string
  complainant_name: string
  complainant_contact?: string
  respondent_name?: string
  respondent_contact?: string
  incident_date?: string
  incident_location?: string
  narrative?: string
  status?: string
  action_taken?: string
  involved_parties?: string
}

export interface ApiBlotter extends RecordModel {
  case_number: string
  incident_type: string
  complainant_name: string
  complainant_contact: string
  respondent_name: string
  respondent_contact: string
  incident_date: string
  incident_location: string
  narrative: string
  status: string
  action_taken: string
  involved_parties: string
  created_by: string
  updated: string
}

export async function getBlotters(): Promise<ApiBlotter[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiBlotter>({ sort: '-incident_date' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getBlotter(id: string): Promise<ApiBlotter> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiBlotter>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createBlotter(data: BlotterData): Promise<ApiBlotter> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiBlotter>(data)
    logActivity('create', COLLECTION, result.id, `Created blotter case: ${result.case_number}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateBlotter(id: string, data: Partial<BlotterData>): Promise<ApiBlotter> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiBlotter>(id, data)
    logActivity('update', COLLECTION, id, `Updated blotter case: ${result.case_number}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteBlotter(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted blotter case`)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getBlottersPage(
  page = 1,
  perPage = 25,
  options: { search?: string; status?: string; incidentType?: string } = {},
): Promise<PaginatedResult<ApiBlotter>> {
  try {
    const filters: string[] = []
    if (options.search) {
      const q = options.search.replace(/"/g, '\\"')
      filters.push(`(complainant_name ~ "${q}" || respondent_name ~ "${q}" || case_number ~ "${q}")`)
    }
    if (options.status) filters.push(`status = "${options.status}"`)
    if (options.incidentType) filters.push(`incident_type = "${options.incidentType}"`)
    const query: Record<string, unknown> = { sort: '-incident_date' }
    if (filters.length > 0) query.filter = filters.join(' && ')
    const result = await getClient().collection(COLLECTION).getList<ApiBlotter>(page, perPage, query)
    return { items: result.items, totalItems: result.totalItems, totalPages: result.totalPages }
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getNextCaseNumber(): Promise<string> {
  try {
    const year = new Date().getFullYear()
    const existing = await getClient().collection(COLLECTION).getFullList<ApiBlotter>({
      filter: `case_number ~ 'BLT-${year}-'`,
      requestKey: 'next-case-number',
    })
    const max = existing.reduce((maxN, b) => {
      const parts = b.case_number.split('-')
      const num = parseInt(parts[2] || '0', 10)
      return num > maxN ? num : maxN
    }, 0)
    return `BLT-${year}-${String(max + 1).padStart(3, '0')}`
  } catch {
    return `BLT-${new Date().getFullYear()}-001`
  }
}

export async function getBlottersSummary(): Promise<{ total: number; pending: number; hearing: number; settled: number; escalated: number; dismissed: number }> {
  try {
    const all = await getClient().collection(COLLECTION).getFullList<ApiBlotter>({ requestKey: 'blotter-summary' })
    return {
      total: all.length,
      pending: all.filter((b) => b.status === 'pending').length,
      hearing: all.filter((b) => b.status === 'hearing').length,
      settled: all.filter((b) => b.status === 'settled').length,
      escalated: all.filter((b) => b.status === 'escalated').length,
      dismissed: all.filter((b) => b.status === 'dismissed').length,
    }
  } catch {
    return { total: 0, pending: 0, hearing: 0, settled: 0, escalated: 0, dismissed: 0 }
  }
}
