import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { RecordModel } from 'pocketbase'

export interface ApiActivity extends RecordModel {
  action: string
  collection: string
  record_id: string
  details: string
  user_name: string
  created: string
}

export async function logActivity(
  action: 'create' | 'update' | 'delete',
  collection: string,
  recordId: string,
  details: string,
): Promise<void> {
  try {
    const user = getClient().authStore.model as { name?: string; email?: string } | null
    await getClient().collection('activity_logs').create({
      action,
      collection,
      record_id: recordId,
      details,
      user_name: user?.name ?? user?.email ?? 'System',
    })
  } catch {
    // Silently fail — logging never breaks main operations
  }
}

export async function getActivities(
  page = 1,
  perPage = 25,
  sort = '-id',
  collection?: string,
  recordId?: string,
): Promise<{ items: ApiActivity[]; totalItems: number; totalPages: number }> {
  try {
    const filters: string[] = []
    if (collection) filters.push(`collection = '${collection}'`)
    if (recordId) filters.push(`record_id = '${recordId}'`)
    const options: Record<string, unknown> = { sort }
    if (filters.length > 0) options.filter = filters.join(' && ')
    const result = await getClient().collection('activity_logs').getList<ApiActivity>(page, perPage, options)
    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    }
  } catch (err) {
    throw handleApiError(err)
  }
}
