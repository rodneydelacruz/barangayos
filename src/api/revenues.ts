import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { ApiIncomeAccount } from './incomeAccounts'
import { createFinanceAuditLog } from './financeAudit'

const COLLECTION = 'revenues'

export type RevenueCategory = 'nta_receipt' | 'tax_receipt' | 'other_receipt' | 'document_fee' | 'donation' | 'grant' | 'other'

export interface RevenueData {
  revenue_date?: string
  income_account?: string
  fund_source?: string
  category?: RevenueCategory
  source?: string
  amount?: number
  document_request?: string
  or_no?: string
  remarks?: string
}

export interface ApiRevenue extends RecordModel {
  revenue_date: string
  income_account: string
  fund_source: string
  category: RevenueCategory
  source: string
  amount: number
  document_request: string
  or_no: string
  remarks: string
  created: string
  updated: string
  expand?: { income_account?: ApiIncomeAccount; document_request?: RecordModel }
}

export async function getRevenues(startDate?: string, endDate?: string, category?: string): Promise<ApiRevenue[]> {
  try {
    const filters: string[] = []
    if (startDate) filters.push(`revenue_date >= "${startDate}"`)
    if (endDate) filters.push(`revenue_date <= "${endDate}"`)
    if (category && category !== 'all') filters.push(`category="${category}"`)
    const filter = filters.join(' && ')
    return await getClient().collection<ApiRevenue>(COLLECTION).getFullList({ filter, sort: '-revenue_date', expand: 'income_account,document_request' })
  } catch (e) { throw handleApiError(e) }
}

export async function getRevenue(id: string): Promise<ApiRevenue> {
  try { return await getClient().collection<ApiRevenue>(COLLECTION).getOne(id, { expand: 'income_account,document_request' }) }
  catch (e) { throw handleApiError(e) }
}

export async function createRevenue(data: RevenueData): Promise<ApiRevenue> {
  try {
    const result = await getClient().collection<ApiRevenue>(COLLECTION).create(data)
    createFinanceAuditLog('create', COLLECTION, result.id, `created revenues: ${result.source || result.or_no || ''}`, result.amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function updateRevenue(id: string, data: Partial<RevenueData>): Promise<ApiRevenue> {
  try {
    const result = await getClient().collection<ApiRevenue>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated revenues`, result.amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteRevenue(id: string): Promise<boolean> {
  try {
    await getClient().collection<ApiRevenue>(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted revenues`)
    return true
  }
  catch (e) { throw handleApiError(e) }
}
