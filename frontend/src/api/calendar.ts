import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { createActivity } from './activity'

const COLLECTION = 'calendar_events'

export interface CalendarEventData {
  title: string
  description?: string
  event_type: string
  start_datetime: string
  end_datetime?: string
  all_day?: boolean
  location?: string
  agenda_ref?: string
  notes?: string
}

export interface ApiCalendarEvent extends RecordModel, CalendarEventData {}

export async function getEvents(): Promise<ApiCalendarEvent[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiCalendarEvent>({ sort: 'start_datetime' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getEventsByMonth(year: number, month: number): Promise<ApiCalendarEvent[]> {
  try {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const start = `${year}-${pad(month)}-01`
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const end = `${nextYear}-${pad(nextMonth)}-01`
    return await getClient().collection(COLLECTION).getFullList<ApiCalendarEvent>({
      sort: 'start_datetime',
      filter: `start_datetime >= '${start}' && start_datetime < '${end}'`,
    })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getEvent(id: string): Promise<ApiCalendarEvent> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiCalendarEvent>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createEvent(data: CalendarEventData): Promise<ApiCalendarEvent> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiCalendarEvent>(data)
    createActivity('create', COLLECTION, result.id, `Created event: ${result.title}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateEvent(id: string, data: Partial<CalendarEventData>): Promise<ApiCalendarEvent> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiCalendarEvent>(id, data)
    createActivity('update', COLLECTION, id, `Updated event: ${result.title}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).getOne<ApiCalendarEvent>(id)
    await getClient().collection(COLLECTION).delete(id)
    createActivity('delete', COLLECTION, id, 'Deleted event')
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}
