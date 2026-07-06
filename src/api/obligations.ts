import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { ApiAppropriation } from './appropriations'
import { createFinanceAuditLog } from './financeAudit'

const COLLECTION = 'obligations'

export interface ObligationData {
  appropriation?: string
  obligation_date?: string
  payee?: string
  particulars?: string
  amount?: number
  disbursed_amount?: number
  status?: 'pending' | 'partial' | 'fully_disbursed'
  notes?: string
}

export interface ApiObligation extends RecordModel {
  appropriation: string
  obligation_date: string
  payee: string
  particulars: string
  amount: number
  disbursed_amount: number
  status: 'pending' | 'partial' | 'fully_disbursed'
  notes: string
  created: string
  updated: string
  expand?: { appropriation?: ApiAppropriation }
}

export async function getObligations(appropriationId?: string): Promise<ApiObligation[]> {
  try {
    const filter = appropriationId ? `appropriation="${appropriationId}"` : ''
    return await getClient().collection<ApiObligation>(COLLECTION).getFullList({ filter, sort: '-obligation_date', expand: 'appropriation' })
  } catch (e) { throw handleApiError(e) }
}

export async function getObligation(id: string): Promise<ApiObligation> {
  try { return await getClient().collection<ApiObligation>(COLLECTION).getOne(id, { expand: 'appropriation' }) }
  catch (e) { throw handleApiError(e) }
}

export async function createObligation(data: ObligationData): Promise<ApiObligation> {
  try {
    const result = await getClient().collection<ApiObligation>(COLLECTION).create(data)
    createFinanceAuditLog('create', COLLECTION, result.id, `created obligations: ${result.payee || ''}`, result.amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function updateObligation(id: string, data: Partial<ObligationData>): Promise<ApiObligation> {
  try {
    const result = await getClient().collection<ApiObligation>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated obligations: ${result.payee || ''}`, result.amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteObligation(id: string): Promise<boolean> {
  try {
    await getClient().collection<ApiObligation>(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted obligations`)
    return true
  }
  catch (e) { throw handleApiError(e) }
}
