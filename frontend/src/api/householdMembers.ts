import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

export interface HouseholdMemberData {
  household_id: string
  last_name: string
  first_name: string
  middle_name?: string
  ext_name?: string
  relationship_to_head: string
  source_of_income?: string
  monthly_income?: number
  sort_order?: number
}

export interface ApiHouseholdMember extends RecordModel, HouseholdMemberData {}

export async function getHouseholdMembers(householdId: string): Promise<ApiHouseholdMember[]> {
  try {
    const filter = getClient().filter('household_id = {:id}', { id: householdId })
    return await getClient().collection('household_members').getFullList<ApiHouseholdMember>({ filter, sort: 'sort_order' })
  } catch (err) { throw handleApiError(err) }
}

export async function createHouseholdMember(data: HouseholdMemberData): Promise<ApiHouseholdMember> {
  try {
    return await getClient().collection('household_members').create<ApiHouseholdMember>(data)
  } catch (err) { throw handleApiError(err) }
}

export async function updateHouseholdMember(id: string, data: Partial<HouseholdMemberData>): Promise<ApiHouseholdMember> {
  try {
    return await getClient().collection('household_members').update<ApiHouseholdMember>(id, data)
  } catch (err) { throw handleApiError(err) }
}

export async function deleteHouseholdMember(id: string): Promise<boolean> {
  try {
    await getClient().collection('household_members').delete(id)
    return true
  } catch (err) { throw handleApiError(err) }
}
