import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

export interface DeceasedRecordData {
  inhabitant_id: string
  date_of_death: string
  immediate_cause_of_death: string
  underlying_cause_of_death: string
  underlying_cause_other?: string
}

export interface ApiDeceasedRecord extends RecordModel, DeceasedRecordData {}

export async function getDeceasedRecords(): Promise<ApiDeceasedRecord[]> {
  try {
    return await getClient().collection('deceased_records').getFullList<ApiDeceasedRecord>({ sort: '-created' })
  } catch (err) { throw handleApiError(err) }
}

export async function createDeceasedRecord(data: DeceasedRecordData): Promise<ApiDeceasedRecord> {
  try {
    const result = await getClient().collection('deceased_records').create<ApiDeceasedRecord>(data)
    await getClient().collection('residents').update(data.inhabitant_id, { is_deceased: true })
    return result
  } catch (err) { throw handleApiError(err) }
}

export async function updateDeceasedRecord(id: string, data: Partial<DeceasedRecordData>): Promise<ApiDeceasedRecord> {
  try {
    return await getClient().collection('deceased_records').update<ApiDeceasedRecord>(id, data)
  } catch (err) { throw handleApiError(err) }
}

export async function deleteDeceasedRecord(id: string): Promise<boolean> {
  try {
    const record = await getClient().collection('deceased_records').getOne<ApiDeceasedRecord>(id)
    await getClient().collection('deceased_records').delete(id)
    const remaining = await getClient().collection('deceased_records').getFullList({
      filter: getClient().filter('inhabitant_id = {:id}', { id: record.inhabitant_id }),
    })
    if (remaining.length === 0) {
      await getClient().collection('residents').update(record.inhabitant_id, { is_deceased: false })
    }
    return true
  } catch (err) { throw handleApiError(err) }
}
