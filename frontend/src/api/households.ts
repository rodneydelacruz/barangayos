import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { createActivity } from './activity'
import type { PaginatedResult } from '@/lib/utils'

const COLLECTION = 'households'

export interface HouseholdData {
  household_number: string
  purok?: string
  head_name: string
  address?: string
  notes?: string
}

export interface ApiHousehold extends RecordModel {
  household_number: string
  purok: string
  head_name: string
  address: string
  notes: string
  updated: string
}

export async function getNextHouseholdNumber(): Promise<string> {
  try {
    const all = await getClient().collection(COLLECTION).getFullList<ApiHousehold>({
      sort: '-created',
      requestKey: 'next-household-number',
    })
    let max = 0
    for (const h of all) {
      const num = parseInt(h.household_number.replace(/[^0-9]/g, ''), 10)
      if (num > max) max = num
    }
    return `H-${String(max + 1).padStart(4, '0')}`
  } catch {
    return 'H-0001'
  }
}

export async function getHouseholdsPage(
  page = 1,
  perPage = 25,
  options: { search?: string; purok?: string } = {},
): Promise<PaginatedResult<ApiHousehold>> {
  try {
    const filters: string[] = []
    if (options.search) {
      const q = options.search.replace(/"/g, '\\"')
      filters.push(`(head_name ~ "${q}" || household_number ~ "${q}")`)
    }
    if (options.purok) filters.push(`purok = "${options.purok}"`)
    const query: Record<string, unknown> = { sort: 'household_number' }
    if (filters.length > 0) query.filter = filters.join(' && ')
    const result = await getClient().collection(COLLECTION).getList<ApiHousehold>(page, perPage, query)
    return { items: result.items, totalItems: result.totalItems, totalPages: result.totalPages }
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getHouseholds(): Promise<ApiHousehold[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiHousehold>({ sort: 'household_number' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function searchHouseholds(query: string): Promise<ApiHousehold[]> {
  try {
    const result = await getClient().collection(COLLECTION).getList<ApiHousehold>(1, 20, {
      filter: `(head_name ~ "${query}" || household_number ~ "${query}" || address ~ "${query}")`,
      sort: 'head_name',
    })
    return result.items
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getHousehold(id: string): Promise<ApiHousehold> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiHousehold>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createHousehold(data: HouseholdData): Promise<ApiHousehold> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiHousehold>(data)
    createActivity('create', COLLECTION, result.id, `Created household: ${result.household_number} — ${result.head_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateHousehold(id: string, data: Partial<HouseholdData>): Promise<ApiHousehold> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiHousehold>(id, data)
    createActivity('update', COLLECTION, id, `Updated household: ${result.household_number} — ${result.head_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteHousehold(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    createActivity('delete', COLLECTION, id, 'Deleted household')
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}
