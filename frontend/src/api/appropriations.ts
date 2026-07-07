import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { ApiFundSource } from './fundSources'
import { getCurrentUser } from '@/auth/session'
import { createFinanceAuditLog } from './financeAudit'
import { createActivity } from './activity'

const COLLECTION = 'appropriations'

export interface AppropriationData {
  fiscal_year?: number
  fund_source?: string
  expense_class?: 'PS' | 'MOOE' | 'CO'
  item_name?: string
  appropriated_amount?: number
  disbursed_amount?: number
  payee?: string
  obligated_date?: string
  fully_disbursed_date?: string
  obligation_notes?: string
  notes?: string
}

export interface ApiAppropriation extends RecordModel {
  fiscal_year: number
  fund_source: string
  expense_class: 'PS' | 'MOOE' | 'CO'
  item_name: string
  appropriated_amount: number
  disbursed_amount: number
  payee: string
  obligated_date: string
  fully_disbursed_date: string
  obligation_notes: string
  notes: string
  created_by?: string
  created: string
  updated: string
  expand?: { fund_source?: ApiFundSource }
}

export async function getAppropriations(fiscalYear?: number): Promise<ApiAppropriation[]> {
  try {
    const filter = fiscalYear ? `fiscal_year=${fiscalYear}` : ''
    return await getClient().collection(COLLECTION).getFullList({ filter, sort: '-id', expand: 'fund_source' })
  } catch (e) { throw handleApiError(e) }
}

export async function getAppropriation(id: string): Promise<ApiAppropriation> {
  try { return await getClient().collection(COLLECTION).getOne(id, { expand: 'fund_source' }) }
  catch (e) { throw handleApiError(e) }
}

export async function markAppropriationAsObligated(id: string, data: { payee: string; obligated_date: string; obligation_notes?: string }): Promise<ApiAppropriation> {
  try {
    const result = await getClient().collection<ApiAppropriation>(COLLECTION).update(id, {
      payee: data.payee,
      obligated_date: data.obligated_date,
      obligation_notes: data.obligation_notes || '',
    })
    createFinanceAuditLog('update', COLLECTION, id, `marked appropriation as obligated: ${result.item_name} → ${data.payee}`)
    createActivity('update', COLLECTION, id, `Marked appropriation as obligated: ${result.item_name}`)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function createAppropriation(data: AppropriationData): Promise<ApiAppropriation> {
  try {
    const result = await getClient().collection<ApiAppropriation>(COLLECTION).create({
      ...data,
      disbursed_amount: 0,
      created_by: getCurrentUser()?.id,
    })
    createFinanceAuditLog('create', COLLECTION, result.id, `created appropriations: ${result.item_name}`, result.appropriated_amount)
    createActivity('create', COLLECTION, result.id, `Created appropriation: ${result.item_name} (${result.expense_class})`)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function updateAppropriation(id: string, data: Partial<AppropriationData>): Promise<ApiAppropriation> {
  try {
    const result = await getClient().collection<ApiAppropriation>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated appropriations: ${result.item_name}`, result.appropriated_amount)
    createActivity('update', COLLECTION, id, `Updated appropriation: ${result.item_name}`)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteAppropriation(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted appropriations`)
    createActivity('delete', COLLECTION, id, 'Deleted appropriation')
    return true
  }
  catch (e) { throw handleApiError(e) }
}
