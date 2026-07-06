import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { logActivity } from './activity'
import type { PaginatedResult } from '@/lib/utils'

const COLLECTION = 'residents'

export interface ResidentData {
  first_name: string
  last_name: string
  middle_name?: string
  suffix?: string
  birth_date?: string
  age?: number
  gender?: string
  contact_number?: string
  household_id?: string
  purok?: string
  civil_status?: string
  occupation?: string
  nationality?: string
  is_voter?: boolean
  is_4ps?: boolean
  is_senior?: boolean
  is_pwd?: boolean
  is_deceased?: boolean
  blood_type?: string
  notes?: string
}

export interface ApiResident extends RecordModel {
  first_name: string
  last_name: string
  middle_name: string
  suffix: string
  birth_date: string
  age: number
  gender: string
  contact_number: string
  household_id: string
  purok: string
  civil_status: string
  occupation: string
  nationality: string
  is_voter: boolean
  is_4ps: boolean
  is_senior: boolean
  is_pwd: boolean
  blood_type: string
  notes: string
  updated: string
}

export async function getResidents(params?: { household_id?: string }): Promise<ApiResident[]> {
  try {
    const query: Record<string, unknown> = { sort: '-id' }
    if (params?.household_id) {
      query.filter = `household_id = '${params.household_id.trim()}'`
    }
    return await getClient().collection(COLLECTION).getFullList<ApiResident>(query)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getResident(id: string): Promise<ApiResident> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiResident>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createResident(data: ResidentData): Promise<ApiResident> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiResident>(data)
    logActivity('create', COLLECTION, result.id, `Created resident: ${result.first_name} ${result.last_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateResident(id: string, data: Partial<ResidentData>): Promise<ApiResident> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiResident>(id, data)
    logActivity('update', COLLECTION, id, `Updated resident: ${result.first_name} ${result.last_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteResident(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted resident`)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getResidentsPage(
  page = 1,
  perPage = 25,
  options: { search?: string; purok?: string; tags?: string[] } = {},
): Promise<PaginatedResult<ApiResident>> {
  try {
    const filters: string[] = []
    if (options.search) {
      const q = options.search.replace(/"/g, '\\"')
      filters.push(`(first_name ~ "${q}" || last_name ~ "${q}" || contact_number ~ "${q}")`)
    }
    if (options.purok) filters.push(`purok = "${options.purok}"`)
    const query: Record<string, unknown> = { sort: '-id' }
    if (filters.length > 0) query.filter = filters.join(' && ')
    const result = await getClient().collection(COLLECTION).getList<ApiResident>(page, perPage, query)
    return { items: result.items, totalItems: result.totalItems, totalPages: result.totalPages }
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getResidentsSummary(): Promise<{ total: number; voters: number; seniors: number; pwd: number }> {
  try {
    const all = await getClient().collection(COLLECTION).getFullList<ApiResident>({ requestKey: 'residents-summary' })
    return {
      total: all.length,
      voters: all.filter((r) => r.is_voter).length,
      seniors: all.filter((r) => r.is_senior).length,
      pwd: all.filter((r) => r.is_pwd).length,
    }
  } catch {
    return { total: 0, voters: 0, seniors: 0, pwd: 0 }
  }
}
