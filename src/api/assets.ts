import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { logActivity } from './activity'

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

export interface ApiAsset extends RecordModel {
  name: string
  asset_type: string
  description: string
  serial_number: string
  purchase_date: string
  purchase_cost: number
  current_value: number
  condition: string
  status: string
  assigned_to: string
  location: string
  image_url: string
  notes: string
  updated: string
}

export interface AssetSummary {
  total: number
  byType: Record<string, number>
  byCondition: Record<string, number>
  byStatus: Record<string, number>
}

export async function getAssets(): Promise<ApiAsset[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiAsset>({ sort: '-created' })
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
    logActivity('create', COLLECTION, result.id, `Created asset: ${data.name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateAsset(id: string, data: Partial<AssetData>): Promise<ApiAsset> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiAsset>(id, data)
    logActivity('update', COLLECTION, id, `Updated asset: ${result.name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteAsset(id: string): Promise<boolean> {
  try {
    const asset = await getAsset(id)
    const name = asset.name
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted asset: ${name}`)
    return true
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
      byStatus[a.status] = (byStatus[a.status] || 0) + 1
    }
    return { total: all.length, byType, byCondition, byStatus }
  } catch {
    return { total: 0, byType: {}, byCondition: {}, byStatus: {} }
  }
}
