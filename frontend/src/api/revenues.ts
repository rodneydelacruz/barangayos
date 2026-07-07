import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { ApiIncomeAccount } from './incomeAccounts'
import type { ApiFundSource } from './fundSources'
import { deductFundSourceBalance, restoreFundSourceBalance } from './fundSources'
import { getCurrentUser } from '@/auth/session'
import { createFinanceAuditLog } from './financeAudit'
import { createActivity } from './activity'

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
  created_by?: string
  created: string
  updated: string
  expand?: { income_account?: ApiIncomeAccount; document_request?: RecordModel; fund_source?: ApiFundSource }
}

export async function getRevenues(startDate?: string, endDate?: string, category?: string): Promise<ApiRevenue[]> {
  try {
    const filters: string[] = []
    if (startDate) filters.push(`revenue_date >= "${startDate}"`)
    if (endDate) filters.push(`revenue_date <= "${endDate}"`)
    if (category && category !== 'all') filters.push(`category="${category}"`)
    const filter = filters.join(' && ')
    return await getClient().collection<ApiRevenue>(COLLECTION).getFullList({ filter, sort: '-revenue_date', expand: 'income_account,document_request,fund_source' })
  } catch (e) { throw handleApiError(e) }
}

export async function getRevenue(id: string): Promise<ApiRevenue> {
  try { return await getClient().collection<ApiRevenue>(COLLECTION).getOne(id, { expand: 'income_account,document_request,fund_source' }) }
  catch (e) { throw handleApiError(e) }
}

export async function getRevenuesByFundSource(fundSourceId: string): Promise<ApiRevenue[]> {
  try {
    return await getClient().collection<ApiRevenue>(COLLECTION).getFullList({
      filter: `fund_source = "${fundSourceId}"`,
      sort: '-revenue_date',
      expand: 'income_account,fund_source',
    })
  } catch (e) { throw handleApiError(e) }
}

export async function createRevenue(data: RevenueData): Promise<ApiRevenue> {
  try {
    const result = await getClient().collection<ApiRevenue>(COLLECTION).create({
      ...data,
      created_by: getCurrentUser()?.id,
    })
    createFinanceAuditLog('create', COLLECTION, result.id, `created revenues: ${result.source || result.or_no || ''}`, result.amount)
    createActivity('create', COLLECTION, result.id, `Created revenue: ${result.source || result.or_no || ''} — ₱${result.amount}`)
    if (result.fund_source && result.amount > 0) {
      await restoreFundSourceBalance(result.fund_source, result.amount, `revenue: ${result.source}`).catch(() => {})
    }
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function updateRevenue(id: string, data: Partial<RevenueData>): Promise<ApiRevenue> {
  try {
    const result = await getClient().collection<ApiRevenue>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated revenues`, result.amount)
    createActivity('update', COLLECTION, id, `Updated revenue: ₱${result.amount}`)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteRevenue(id: string): Promise<boolean> {
  try {
    const existing = await getRevenue(id)
    await getClient().collection<ApiRevenue>(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted revenues`)
    createActivity('delete', COLLECTION, id, 'Deleted revenue')
    if (existing.fund_source && existing.amount > 0) {
      await deductFundSourceBalance(existing.fund_source, existing.amount, `revenue deleted: ${existing.source}`).catch(() => {})
    }
    return true
  }
  catch (e) { throw handleApiError(e) }
}
