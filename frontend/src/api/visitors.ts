import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { createActivity } from './activity'

const COLLECTION = 'visitor_logs'

export interface VisitorData {
  visitor_name: string
  contact_number?: string
  purpose: string
  person_to_visit?: string
  time_out?: string
}

export interface ApiVisitor extends RecordModel {
  visitor_name: string
  contact_number: string
  purpose: string
  person_to_visit: string
  time_in: string
  time_out: string
  updated: string
}

export async function getVisitors(): Promise<ApiVisitor[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiVisitor>({ sort: '-time_in' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getVisitor(id: string): Promise<ApiVisitor> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiVisitor>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createVisitor(data: VisitorData): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiVisitor>(data)
    createActivity('create', COLLECTION, result.id, `Created visitor log: ${result.visitor_name} — ${result.purpose}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateVisitor(id: string, data: Partial<VisitorData>): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiVisitor>(id, data)
    createActivity('update', COLLECTION, id, `Updated visitor log: ${result.visitor_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteVisitor(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    createActivity('delete', COLLECTION, id, 'Deleted visitor log')
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function checkOutVisitor(id: string): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiVisitor>(id, {
      time_out: new Date().toISOString(),
    })
    createActivity('update', COLLECTION, id, `Checked out visitor: ${result.visitor_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}
