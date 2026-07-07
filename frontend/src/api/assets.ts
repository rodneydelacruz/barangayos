import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { createActivity } from './activity'
import type { PaginatedResult } from '@/lib/utils'

const COLLECTION = 'assets'

export interface AssetData {
  name: string
  asset_type: string
  description?: string
  serial_number?: string
  purchase_date?: string
  purchase_cost?: number
  current_value?: number
  condition: string
  status?: string
  assigned_to?: string
  location?: string
  image_url?: string
  notes?: string
}

export interface ApiAsset extends RecordModel, AssetData {}

export interface AssetSummary {
  total: number
  byType: Record<string, number>
  byCondition: Record<string, number>
  byStatus: Record<string, number>
}

export async function getAssets(): Promise<ApiAsset[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiAsset>({ sort: '-id' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getAsset(id: string): Promise<ApiAsset> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiAsset>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createAsset(data: AssetData): Promise<ApiAsset> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiAsset>(data)
    createActivity('create', COLLECTION, result.id, `Created asset: ${result.name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateAsset(id: string, data: Partial<AssetData>): Promise<ApiAsset> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiAsset>(id, data)
    createActivity('update', COLLECTION, id, `Updated asset: ${result.name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteAsset(id: string): Promise<boolean> {
  try {
    await getAsset(id)
    await getClient().collection(COLLECTION).delete(id)
    createActivity('delete', COLLECTION, id, 'Deleted asset')
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getAssetsPage(
  page = 1,
  perPage = 25,
  options: { search?: string; type?: string; condition?: string; status?: string } = {},
): Promise<PaginatedResult<ApiAsset>> {
  try {
    const filters: string[] = []
    if (options.search) {
      const q = options.search.replace(/"/g, '\\"')
      filters.push(`(name ~ "${q}" || serial_number ~ "${q}")`)
    }
    if (options.type) filters.push(`asset_type = "${options.type}"`)
    if (options.condition) filters.push(`condition = "${options.condition}"`)
    if (options.status) filters.push(`status = "${options.status}"`)
    const query: Record<string, unknown> = { sort: '-id' }
    if (filters.length > 0) query.filter = filters.join(' && ')
    const result = await getClient().collection(COLLECTION).getList<ApiAsset>(page, perPage, query)
    return { items: result.items, totalItems: result.totalItems, totalPages: result.totalPages }
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getAssetSummary(): Promise<AssetSummary> {
  try {
    const all = await getClient().collection(COLLECTION).getFullList<ApiAsset>({ requestKey: 'assets-summary' })
    const byType: Record<string, number> = {}
    const byCondition: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    for (const a of all) {
      byType[a.asset_type] = (byType[a.asset_type] || 0) + 1
      byCondition[a.condition] = (byCondition[a.condition] || 0) + 1
      const s = a.status ?? 'unknown'
      byStatus[s] = (byStatus[s] || 0) + 1
    }
    return { total: all.length, byType, byCondition, byStatus }
  } catch {
    return { total: 0, byType: {}, byCondition: {}, byStatus: {} }
  }
}
