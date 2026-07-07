import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { createActivity } from './activity'

const COLLECTION = 'agenda_items'

export interface AgendaItemData {
  meeting_id: string
  title: string
  description?: string
  sort_order?: number
  status: string
  minutes?: string
  submitted_by?: string
}

export interface ApiAgendaItem extends RecordModel, AgendaItemData {}

export async function getAgendaItems(meetingId: string): Promise<ApiAgendaItem[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiAgendaItem>({
      filter: `meeting_id = '${meetingId}'`,
      sort: 'sort_order',
    })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createAgendaItem(data: AgendaItemData): Promise<ApiAgendaItem> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiAgendaItem>(data)
    createActivity('create', COLLECTION, result.id, `Created agenda item: ${result.title}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateAgendaItem(id: string, data: Partial<AgendaItemData>): Promise<ApiAgendaItem> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiAgendaItem>(id, data)
    createActivity('update', COLLECTION, id, `Updated agenda item: ${result.title}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteAgendaItem(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).getOne<ApiAgendaItem>(id)
    await getClient().collection(COLLECTION).delete(id)
    createActivity('delete', COLLECTION, id, 'Deleted agenda item')
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function reorderAgendaItems(items: { id: string; sort_order: number }[]): Promise<void> {
  try {
    await Promise.all(
      items.map(item =>
        getClient().collection(COLLECTION).update(item.id, { sort_order: item.sort_order }),
      ),
    )
    createActivity('update', COLLECTION, 'reorder', `Reordered ${items.length} agenda items`)
  } catch (err) {
    throw handleApiError(err)
  }
}
