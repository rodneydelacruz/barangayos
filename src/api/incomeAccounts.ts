import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { createFinanceAuditLog } from './financeAudit'

const COLLECTION = 'income_accounts'

export interface IncomeAccountData {
  coa_code?: string
  name?: string
  fiscal_year?: number
  budgeted_amount?: number
  notes?: string
}

export interface ApiIncomeAccount extends RecordModel {
  coa_code: string
  name: string
  fiscal_year: number
  budgeted_amount: number
  notes: string
  created: string
  updated: string
}

export async function getIncomeAccounts(fiscalYear?: number): Promise<ApiIncomeAccount[]> {
  try {
    const filter = fiscalYear ? `fiscal_year=${fiscalYear}` : ''
    return await getClient().collection<ApiIncomeAccount>(COLLECTION).getFullList({ filter, sort: '-created' })
  } catch (e) { throw handleApiError(e) }
}

export async function getIncomeAccount(id: string): Promise<ApiIncomeAccount> {
  try { return await getClient().collection<ApiIncomeAccount>(COLLECTION).getOne(id) }
  catch (e) { throw handleApiError(e) }
}

export async function createIncomeAccount(data: IncomeAccountData): Promise<ApiIncomeAccount> {
  try {
    const result = await getClient().collection<ApiIncomeAccount>(COLLECTION).create(data)
    createFinanceAuditLog('create', COLLECTION, result.id, `created income_accounts: ${result.name}`)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function updateIncomeAccount(id: string, data: Partial<IncomeAccountData>): Promise<ApiIncomeAccount> {
  try {
    const result = await getClient().collection<ApiIncomeAccount>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated income_accounts: ${result.name}`)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteIncomeAccount(id: string): Promise<boolean> {
  try {
    await getClient().collection<ApiIncomeAccount>(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted income_accounts`)
    return true
  }
  catch (e) { throw handleApiError(e) }
}
