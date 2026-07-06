import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { ApiAppropriation } from './appropriations'
import { getAppropriation, updateAppropriation } from './appropriations'
import { deductFundSourceBalance, restoreFundSourceBalance } from './fundSources'
import { createFinanceAuditLog } from './financeAudit'

const COLLECTION = 'disbursements'

export interface DisbursementData {
  appropriation?: string
  payee?: string
  disbursement_date?: string
  amount?: number
  check_no?: string
  or_no?: string
  particular?: string
  notes?: string
}

export interface ApiDisbursement extends RecordModel {
  appropriation: string
  payee: string
  disbursement_date: string
  amount: number
  check_no: string
  or_no: string
  particular: string
  notes: string
  created: string
  updated: string
  expand?: { appropriation?: ApiAppropriation }
}

export async function getDisbursements(startDate?: string, endDate?: string): Promise<ApiDisbursement[]> {
  try {
    let filter = ''
    const filters: string[] = []
    if (startDate) filters.push(`disbursement_date >= "${startDate}"`)
    if (endDate) filters.push(`disbursement_date <= "${endDate}"`)
    if (filters.length) filter = filters.join(' && ')
    return await getClient().collection<ApiDisbursement>(COLLECTION).getFullList({ filter, sort: '-disbursement_date', expand: 'appropriation' })
  } catch (e) { throw handleApiError(e) }
}

export async function getDisbursement(id: string): Promise<ApiDisbursement> {
  try { return await getClient().collection<ApiDisbursement>(COLLECTION).getOne(id, { expand: 'appropriation' }) }
  catch (e) { throw handleApiError(e) }
}

export async function createDisbursement(data: DisbursementData): Promise<ApiDisbursement> {
  try {
    const result = await getClient().collection<ApiDisbursement>(COLLECTION).create(data)
    const appr = await getAppropriation(data.appropriation || '')
    const newDisbursed = (appr.disbursed_amount || 0) + (data.amount || 0)
    await updateAppropriation(appr.id, {
      disbursed_amount: newDisbursed,
      fully_disbursed_date: newDisbursed >= appr.appropriated_amount ? new Date().toISOString().split('T')[0] : appr.fully_disbursed_date || '',
    })
    await deductFundSourceBalance(
      appr.fund_source,
      data.amount || 0,
      `Disbursed ₱${(data.amount || 0).toLocaleString()} for ${appr.item_name}`,
    )
    createFinanceAuditLog('create', COLLECTION, result.id, `created disbursements: ${data.particular || ''}`, data.amount)
    return { ...result, expand: { appropriation: appr } }
  }
  catch (e) { throw handleApiError(e) }
}

export async function updateDisbursement(id: string, data: Partial<DisbursementData>): Promise<ApiDisbursement> {
  try {
    const result = await getClient().collection<ApiDisbursement>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated disbursements`, result.amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteDisbursement(id: string): Promise<boolean> {
  try {
    const existing = await getDisbursement(id)
    const appr = await getAppropriation(existing.appropriation)
    const newDisbursed = Math.max(0, (appr.disbursed_amount || 0) - existing.amount)
    await updateAppropriation(appr.id, {
      disbursed_amount: newDisbursed,
      fully_disbursed_date: newDisbursed > 0 ? appr.fully_disbursed_date || '' : '',
    })
    await restoreFundSourceBalance(
      appr.fund_source,
      existing.amount,
      `Restored ₱${existing.amount.toLocaleString()} from deleted disbursement for ${appr.item_name}`,
    )
    await getClient().collection(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted disbursements`)
    return true
  }
  catch (e) { throw handleApiError(e) }
}
