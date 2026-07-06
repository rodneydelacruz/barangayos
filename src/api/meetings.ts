import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { logActivity } from './activity'
import { getAgendaItems, type ApiAgendaItem } from './agenda'
import type { PaginatedResult } from '@/lib/utils'

const COLLECTION = 'meetings'

export interface MeetingData {
  title: string
  meeting_date: string
  location?: string
  meeting_type: string
  status: string
  notes?: string
}

export interface ApiMeeting extends RecordModel, MeetingData {}

export interface MeetingWithItems extends ApiMeeting {
  agendaItems: ApiAgendaItem[]
}

export async function getMeetings(): Promise<ApiMeeting[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiMeeting>({ sort: '-meeting_date' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getMeeting(id: string): Promise<MeetingWithItems> {
  try {
    const meeting = await getClient().collection(COLLECTION).getOne<ApiMeeting>(id)
    const agendaItems = await getAgendaItems(id)
    return { ...meeting, agendaItems }
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createMeeting(data: MeetingData): Promise<ApiMeeting> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiMeeting>(data)
    logActivity('create', COLLECTION, result.id, `Created meeting: ${data.title}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateMeeting(id: string, data: Partial<MeetingData>): Promise<ApiMeeting> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiMeeting>(id, data)
    logActivity('update', COLLECTION, id, `Updated meeting: ${result.title}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteMeeting(id: string): Promise<boolean> {
  try {
    const meeting = await getClient().collection(COLLECTION).getOne<ApiMeeting>(id)
    const title = meeting.title
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted meeting: ${title}`)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getMeetingsPage(
  page = 1,
  perPage = 25,
  options: { search?: string; status?: string } = {},
): Promise<PaginatedResult<ApiMeeting>> {
  try {
    const filters: string[] = []
    if (options.search) {
      const q = options.search.replace(/"/g, '\\"')
      filters.push(`title ~ "${q}"`)
    }
    if (options.status) filters.push(`status = "${options.status}"`)
    const query: Record<string, unknown> = { sort: '-meeting_date' }
    if (filters.length > 0) query.filter = filters.join(' && ')
    const result = await getClient().collection(COLLECTION).getList<ApiMeeting>(page, perPage, query)
    return { items: result.items, totalItems: result.totalItems, totalPages: result.totalPages }
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getUpcomingMeetings(): Promise<ApiMeeting[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    return await getClient().collection(COLLECTION).getFullList<ApiMeeting>({
      filter: `meeting_date >= '${today}'`,
      sort: 'meeting_date',
    })
  } catch (err) {
    throw handleApiError(err)
  }
}
