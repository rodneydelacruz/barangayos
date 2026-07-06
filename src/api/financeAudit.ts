import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { RecordModel } from 'pocketbase'

export interface ApiFinanceAudit extends RecordModel {
  action: string
  collection_name: string
  record_id: string
  details: string
  amount: number
  user_name: string
  created: string
}

export async function getFinanceAuditLogs(
  page = 1,
  perPage = 25,
  sort = '-created',
  collectionName?: string,
): Promise<{ items: ApiFinanceAudit[]; totalItems: number; totalPages: number }> {
  try {
    const filters: string[] = []
    if (collectionName) filters.push(`collection_name = '${collectionName}'`)
    const options: Record<string, unknown> = { sort }
    if (filters.length > 0) options.filter = filters.join(' && ')
    const result = await getClient().collection('finance_audit_logs').getList<ApiFinanceAudit>(page, perPage, options)
    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    }
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createFinanceAuditLog(
  action: 'create' | 'update' | 'delete',
  collectionName: string,
  recordId: string,
  details: string,
  amount = 0,
): Promise<void> {
  try {
    const user = getClient().authStore.model as Record<string, unknown> | null
    const userName = (user?.name as string) ?? (user?.email as string) ?? 'System'
    await getClient().collection('finance_audit_logs').create({
      action,
      collection_name: collectionName,
      record_id: recordId,
      details,
      amount,
      user_name: userName,
    })
  } catch {
    // Silent - audit failure should not block the main operation
  }
}
