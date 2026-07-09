import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { createActivity } from './activity'
import type { PaginatedResult } from '@/lib/utils'

const COLLECTION = 'residents'

export interface InhabitantData {
  // Classification
  type_of_resident?: string
  household_id?: string

  // Personal Information
  philsys_card_no?: string
  first_name: string
  last_name: string
  middle_name?: string
  ext_name?: string
  date_of_birth?: string
  place_of_birth?: string
  residence_of_mother_upon_birth?: string
  sex?: string
  gender?: string
  gender_other?: string
  civil_status?: string
  pregnant_woman?: boolean
  highest_educational_attainment?: string
  profession_occupation?: string
  mother_maiden_first_name?: string
  mother_maiden_middle_name?: string
  mother_maiden_last_name?: string

  // Contact Details
  email_address?: string
  mobile_number?: string
  tel_number?: string

  // Address
  region?: string
  province?: string
  city_municipality?: string
  barangay?: string
  sitio_purok?: string
  house_block_lot_no?: string
  street_name?: string
  subdivision_village?: string
  zip_code?: string

  // Identity Information
  blood_type?: string
  height_m?: number
  weight_kg?: number
  complexion?: string
  nationality?: string
  ethnicity?: string
  religion?: string
  religion_other?: string

  // Voter Info
  registered_voter?: boolean
  resident_voter?: boolean
  last_voted_year?: number

  // Beneficiary Info
  government_assistance_programs?: string[]
  government_assistance_other?: string

  // Sectoral Info (all boolean)
  employed?: boolean
  unemployed?: boolean
  ofw?: boolean
  indigenous_people?: boolean
  student?: boolean
  out_of_school_children?: boolean
  out_of_school_youth?: boolean
  migrant?: boolean
  refugee?: boolean
  senior_citizen?: boolean
  pwd?: boolean
  single_solo_parent?: boolean

  // Consent
  data_privacy_consent?: boolean
  consent_signature_date?: string

  // Soft-delete
  is_deceased?: boolean
}

export interface ApiResident extends RecordModel {
  // Classification
  type_of_resident: string
  household_id: string

  // Personal Information
  philsys_card_no: string
  first_name: string
  last_name: string
  middle_name: string
  ext_name: string
  date_of_birth: string
  age: number
  place_of_birth: string
  residence_of_mother_upon_birth: string
  sex: string
  gender: string
  gender_other: string
  civil_status: string
  pregnant_woman: boolean
  highest_educational_attainment: string
  profession_occupation: string
  mother_maiden_first_name: string
  mother_maiden_middle_name: string
  mother_maiden_last_name: string

  // Contact Details
  email_address: string
  mobile_number: string
  tel_number: string

  // Address
  region: string
  province: string
  city_municipality: string
  barangay: string
  sitio_purok: string
  house_block_lot_no: string
  street_name: string
  subdivision_village: string
  zip_code: string

  // Identity Information
  blood_type: string
  height_m: number
  weight_kg: number
  complexion: string
  nationality: string
  ethnicity: string
  religion: string
  religion_other: string

  // Voter Info
  registered_voter: boolean
  resident_voter: boolean
  last_voted_year: number

  // Beneficiary Info
  government_assistance_programs: string[]
  government_assistance_other: string

  // Sectoral Info
  employed: boolean
  unemployed: boolean
  ofw: boolean
  indigenous_people: boolean
  student: boolean
  out_of_school_children: boolean
  out_of_school_youth: boolean
  migrant: boolean
  refugee: boolean
  senior_citizen: boolean
  pwd: boolean
  single_solo_parent: boolean

  // Consent
  data_privacy_consent: boolean
  consent_signature_date: string

  // Soft-delete
  is_deceased: boolean

  updated: string
}

export async function getResidents(params?: { household_id?: string }): Promise<ApiResident[]> {
  try {
    const query: Record<string, unknown> = { sort: '-id' }
    if (params?.household_id) {
      query.filter = getClient().filter('household_id = {:id}', { id: params.household_id.trim() })
    }
    return await getClient().collection(COLLECTION).getFullList<ApiResident>(query)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getResident(id: string): Promise<ApiResident> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiResident>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createResident(data: InhabitantData): Promise<ApiResident> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiResident>(data)
    createActivity('create', COLLECTION, result.id, `Created resident: ${result.first_name} ${result.last_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateResident(id: string, data: Partial<InhabitantData>): Promise<ApiResident> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiResident>(id, data)
    createActivity('update', COLLECTION, id, `Updated resident: ${result.first_name} ${result.last_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteResident(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    createActivity('delete', COLLECTION, id, 'Deleted resident')
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getResidentsPage(
  page = 1,
  perPage = 25,
  options: { search?: string; sitio_purok?: string; tags?: string[] } = {},
): Promise<PaginatedResult<ApiResident>> {
  try {
    const filters: string[] = []
    if (options.search) {
      filters.push(getClient().filter('(first_name ~ {:q} || last_name ~ {:q} || mobile_number ~ {:q})', { q: options.search }))
    }
    if (options.sitio_purok) filters.push(getClient().filter('sitio_purok = {:p}', { p: options.sitio_purok }))
    const query: Record<string, unknown> = { sort: '-id' }
    if (filters.length > 0) query.filter = filters.join(' && ')
    const result = await getClient().collection(COLLECTION).getList<ApiResident>(page, perPage, query)
    return { items: result.items, totalItems: result.totalItems, totalPages: result.totalPages }
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getResidentsSummary(): Promise<{
  total: number
  voters: number
  seniors: number
  pwd: number
  registered_voters: number
}> {
  try {
    const all = await getClient().collection(COLLECTION).getFullList<ApiResident>({ requestKey: 'residents-summary' })
    return {
      total: all.length,
      voters: all.filter((r) => r.registered_voter).length,
      registered_voters: all.filter((r) => r.registered_voter).length,
      seniors: all.filter((r) => r.senior_citizen).length,
      pwd: all.filter((r) => r.pwd).length,
    }
  } catch {
    return { total: 0, voters: 0, seniors: 0, pwd: 0, registered_voters: 0 }
  }
}
