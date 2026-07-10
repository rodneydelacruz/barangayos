import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { updateHousehold } from './households'

export interface HouseholdMemberData {
  household_id: string
  last_name: string
  first_name: string
  middle_name?: string
  ext_name?: string
  resident_id?: string
  relationship_to_head: string
  source_of_income?: string
  monthly_income?: number
  sort_order?: number
  data_set?: string
}

export interface ApiHouseholdMember extends RecordModel, HouseholdMemberData {
  resident_id: string
}

export async function getHouseholdMembers(householdId: string): Promise<ApiHouseholdMember[]> {
  try {
    const filter = getClient().filter('household_id = {:id}', { id: householdId })
    return await getClient().collection('household_members').getFullList<ApiHouseholdMember>({ filter, sort: 'sort_order' })
  } catch (err) { throw handleApiError(err) }
}

export async function createHouseholdMember(data: HouseholdMemberData): Promise<ApiHouseholdMember> {
  try {
    // Fix M3: Reject if trying to add a second Household Head (code "1")
    if (data.relationship_to_head === '1') {
      const existing = await getHouseholdMembers(data.household_id)
      const hasHead = existing.some((m) => m.relationship_to_head === '1')
      if (hasHead) {
        throw new Error('This household already has a Household Head (relationship code 1). Remove the existing head first.')
      }
    }

    const created = await getClient().collection('household_members').create<ApiHouseholdMember>({ ...data, data_set: 'BIPS' })

    // Fix M4: Recalc count after adding a member
    const all = await getHouseholdMembers(data.household_id)
    await updateHousehold(data.household_id, { no_of_household_members: all.length })

    return created
  } catch (err) { throw handleApiError(err) }
}

export async function updateHouseholdMember(id: string, data: Partial<HouseholdMemberData>): Promise<ApiHouseholdMember> {
  try {
    // Fix M3: Enforce single head on code change TO "1"
    if (data.relationship_to_head === '1') {
      // Fetch the current record to get household_id
      const current = await getClient().collection('household_members').getOne<ApiHouseholdMember>(id)
      const existing = await getHouseholdMembers(current.household_id)
      const hasOtherHead = existing.some((m) => m.relationship_to_head === '1' && m.id !== id)
      if (hasOtherHead) {
        throw new Error('This household already has a Household Head (relationship code 1). Remove the existing head first.')
      }
    }

    return await getClient().collection('household_members').update<ApiHouseholdMember>(id, data)
  } catch (err) { throw handleApiError(err) }
}

export async function deleteHouseholdMember(id: string): Promise<boolean> {
  try {
    // Fetch the record before deleting (to get household_id for recalc + resident_id for cascade)
    const record = await getClient().collection('household_members').getOne<ApiHouseholdMember>(id)
    const hhId = record.household_id
    const residentId = record.resident_id

    await getClient().collection('household_members').delete(id)

    // Cascade: unlink the resident's household_id
    if (residentId) {
      try {
        await getClient().collection('residents').update(residentId, { household_id: '' })
      } catch { /* resident may not exist — ignore */ }
    }

    // Fix M4: Recalc count after deleting a member
    if (hhId) {
      const remaining = await getHouseholdMembers(hhId)
      await updateHousehold(hhId, { no_of_household_members: remaining.length })
    }

    return true
  } catch (err) { throw handleApiError(err) }
}
