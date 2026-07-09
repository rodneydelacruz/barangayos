import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

export interface MigrantData {
  household_id: string
  last_name: string
  first_name: string
  middle_name?: string
  ext_name?: string
  previous_residence: string
  length_of_stay_previous_barangay: string
  reason_for_leaving: string
  reason_for_leaving_other?: string
  date_of_transfer: string
  reason_for_transferring: string
  reason_for_transferring_other?: string
  duration_of_stay_current_barangay: string
  intention_to_return: boolean
}

export interface ApiMigrant extends RecordModel, MigrantData {}

export async function getMigrants(householdId: string): Promise<ApiMigrant[]> {
  try {
    const filter = getClient().filter('household_id = {:id}', { id: householdId })
    return await getClient().collection('migrant_info').getFullList<ApiMigrant>({ filter })
  } catch (err) { throw handleApiError(err) }
}

export async function createMigrant(data: MigrantData): Promise<ApiMigrant> {
  try { return await getClient().collection('migrant_info').create<ApiMigrant>(data) }
  catch (err) { throw handleApiError(err) }
}

export async function updateMigrant(id: string, data: Partial<MigrantData>): Promise<ApiMigrant> {
  try { return await getClient().collection('migrant_info').update<ApiMigrant>(id, data) }
  catch (err) { throw handleApiError(err) }
}

export async function deleteMigrant(id: string): Promise<boolean> {
  try { await getClient().collection('migrant_info').delete(id); return true }
  catch (err) { throw handleApiError(err) }
}
