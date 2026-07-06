import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { ApiFundSource } from './fundSources'
import { createFinanceAuditLog } from './financeAudit'

const COLLECTION = 'appropriations'

export interface AppropriationData {
  fiscal_year?: number
  fund_source?: string
  expense_class?: 'PS' | 'MOOE' | 'CO'
  item_name?: string
  appropriated_amount?: number
  obligated_amount?: number
  disbursed_amount?: number
  status?: 'active' | 'closed'
  notes?: string
}

export interface ApiAppropriation extends RecordModel {
  fiscal_year: number
  fund_source: string
  expense_class: 'PS' | 'MOOE' | 'CO'
  item_name: string
  appropriated_amount: number
  obligated_amount: number
  disbursed_amount: number
  status: 'active' | 'closed'
  notes: string
  created: string
  updated: string
  expand?: { fund_source?: ApiFundSource }
}

export async function getAppropriations(fiscalYear?: number): Promise<ApiAppropriation[]> {
  try {
    const filter = fiscalYear ? `fiscal_year=${fiscalYear}` : ''
    return await getClient().collection(COLLECTION).getFullList({ filter, sort: '-created', expand: 'fund_source' })
  } catch (e) { throw handleApiError(e) }
}

export async function getAppropriation(id: string): Promise<ApiAppropriation> {
  try { return await getClient().collection(COLLECTION).getOne(id, { expand: 'fund_source' }) }
  catch (e) { throw handleApiError(e) }
}

export async function createAppropriation(data: AppropriationData): Promise<ApiAppropriation> {
  try {
    const result = await getClient().collection<ApiAppropriation>(COLLECTION).create(data)
    createFinanceAuditLog('create', COLLECTION, result.id, `created appropriations: ${result.item_name}`, result.appropriated_amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function updateAppropriation(id: string, data: Partial<AppropriationData>): Promise<ApiAppropriation> {
  try {
    const result = await getClient().collection<ApiAppropriation>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated appropriations: ${result.item_name}`, result.appropriated_amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteAppropriation(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted appropriations`)
    return true
  }
  catch (e) { throw handleApiError(e) }
}
