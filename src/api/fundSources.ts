import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { createFinanceAuditLog } from './financeAudit'

const COLLECTION = 'fund_sources'

export interface FundSourceData {
  name?: string
  code?: string
  description?: string
  statutory_rule?: 'none' | '20%_DF' | 'SK' | 'BDRRMF' | 'GAD'
  current_balance?: number
  original_balance?: number
  fiscal_year?: number
  is_active?: boolean
  notes?: string
}

export interface ApiFundSource extends RecordModel {
  name: string
  code: string
  description: string
  statutory_rule: 'none' | '20%_DF' | 'SK' | 'BDRRMF' | 'GAD'
  current_balance: number
  original_balance: number
  fiscal_year: number
  is_active: boolean
  notes: string
  created: string
  updated: string
}

export async function getFundSources(fiscalYear?: number): Promise<ApiFundSource[]> {
  try {
    const filter = fiscalYear ? `fiscal_year=${fiscalYear}` : ''
    return await getClient().collection<ApiFundSource>(COLLECTION).getFullList({ filter, sort: '-created' })
  } catch (e) { throw handleApiError(e) }
}

export async function getFundSource(id: string): Promise<ApiFundSource> {
  try { return await getClient().collection<ApiFundSource>(COLLECTION).getOne(id) }
  catch (e) { throw handleApiError(e) }
}

export async function createFundSource(data: FundSourceData): Promise<ApiFundSource> {
  try {
    const payload = { ...data, original_balance: data.original_balance ?? data.current_balance ?? 0 }
    const result = await getClient().collection<ApiFundSource>(COLLECTION).create(payload)
    createFinanceAuditLog('create', COLLECTION, result.id, `created fund_sources: ${result.name}`)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deductFundSourceBalance(id: string, amount: number, details: string): Promise<ApiFundSource> {
  try {
    const fs = await getFundSource(id)
    const newBalance = (fs.current_balance || 0) - amount
    const result = await getClient().collection<ApiFundSource>(COLLECTION).update(id, { current_balance: newBalance })
    createFinanceAuditLog('update', COLLECTION, id, details, amount)
    return result
  } catch (e) { throw handleApiError(e) }
}

export async function restoreFundSourceBalance(id: string, amount: number, details: string): Promise<ApiFundSource> {
  try {
    const fs = await getFundSource(id)
    const newBalance = (fs.current_balance || 0) + amount
    const result = await getClient().collection<ApiFundSource>(COLLECTION).update(id, { current_balance: newBalance })
    createFinanceAuditLog('update', COLLECTION, id, details, amount)
    return result
  } catch (e) { throw handleApiError(e) }
}

export async function updateFundSource(id: string, data: Partial<FundSourceData>): Promise<ApiFundSource> {
  try {
    const result = await getClient().collection<ApiFundSource>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated fund_sources: ${result.name}`)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteFundSource(id: string): Promise<boolean> {
  try {
    await getClient().collection<ApiFundSource>(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted fund_sources`)
    return true
  }
  catch (e) { throw handleApiError(e) }
}
