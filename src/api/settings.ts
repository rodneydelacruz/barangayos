import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

export interface ApiSetting extends RecordModel {
  key: string
  value: any
}

const COLLECTION = 'system_settings'

export async function getAllSettings(): Promise<Record<string, any>> {
  try {
    const records = await getClient().collection(COLLECTION).getFullList<ApiSetting>()
    const settings: Record<string, any> = {}
    for (const record of records) {
      settings[record.key] = record.value
    }
    return settings
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getSetting(key: string): Promise<any | null> {
  try {
    const record = await getClient().collection(COLLECTION).getFirstListItem<ApiSetting>(`key = "${key}"`, {
      $autoCancel: false,
    })
    return record.value
  } catch {
    return null
  }
}

export async function updateSetting(id: string, _key: string, value: any): Promise<void> {
  try {
    await getClient().collection(COLLECTION).update(id, { value })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function upsertSetting(key: string, value: any): Promise<ApiSetting> {
  try {
    const existing = await getClient().collection(COLLECTION).getFirstListItem<ApiSetting>(`key = "${key}"`, {
      $autoCancel: false,
    }).catch(() => null)

    if (existing) {
      return await getClient().collection(COLLECTION).update(existing.id, { value })
    }

    return await getClient().collection(COLLECTION).create({ key, value })
  } catch (err) {
    throw handleApiError(err)
  }
}

export interface DocumentFees {
  barangay_clearance: number
  business_permit: number
  certificate_of_indigency: number
  certificate_of_residency: number
  certificate_of_good_moral: number
  cedula: number
  other: number
}

export interface ComplianceWarningItem {
  type: string
  fund_source?: string
  code?: string
  required?: number
  actual?: number
  shortfall?: number
  ps_total?: number
  cap?: number
  excess?: number
}

export interface ComplianceWarnings {
  [fiscalYear: string]: ComplianceWarningItem[]
}

export interface FinanceConfig {
  default_income_account: string
  default_fund_source: string
  auto_create_revenue_on_payment: boolean
  current_fiscal_year: number
  preceding_year_income: number
  complianceWarnings: ComplianceWarnings
  document_fees: DocumentFees
}

export async function getFinanceConfig(): Promise<FinanceConfig | null> {
  try {
    const record = await getClient().collection(COLLECTION).getFirstListItem('key="barangay_config"', { $autoCancel: false })
    const raw = record.get("finance_config")
    if (typeof raw === "string") return JSON.parse(raw) as FinanceConfig
    return raw as FinanceConfig
  } catch { return null }
}

export async function updateFinanceConfig(config: FinanceConfig): Promise<void> {
  try {
    const record = await getClient().collection(COLLECTION).getFirstListItem('key="barangay_config"', { $autoCancel: false })
    await getClient().collection(COLLECTION).update(record.id, { finance_config: JSON.stringify(config) })
  } catch (e) { throw handleApiError(e) }
}
