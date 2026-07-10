/**
 * BIMS-Compliant CSV Export
 *
 * Generates CSV files that match the LGUSS-BIMS data import format
 * based on BIMS Form A1 (Household Profile) and the RBI Form A standard.
 *
 * Produces three CSV files suitable for BIMS import:
 *   1. bims_households.csv      — Part 1: Household Geographic & General Info
 *   2. bims_household_members.csv — Part 2: Household Members Listing
 *   3. bims_migrants.csv         — Part 3: Migrant Information
 *
 * The CSV column names follow the BIMS standard format used by DILG
 * for data validation and import into the LGUSS-BIMS system.
 */

import type { ApiHousehold } from '@/api/households'
import type { ApiHouseholdMember } from '@/api/householdMembers'
import type { ApiMigrant } from '@/api/migrantInfo'
import type { ApiResident } from '@/api/residents'

/* ─── helpers ─────────────────────────────────────────────────── */

function csvEscape(val: unknown): string {
  if (val == null) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function csvRow(values: (unknown)[]): string {
  return values.map(csvEscape).join(',') + '\n'
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/* ─── lookup helpers ──────────────────────────────────────────── */

export interface CsvLabelMaps {
  householdTypeLabel?: Map<string, string>
  tenureStatusLabel?: Map<string, string>
  householdUnitLabel?: Map<string, string>
  relationshipLabel?: Map<string, string>
  incomeLabel?: Map<string, string>
  leavingLabel?: Map<string, string>
  transferringLabel?: Map<string, string>
}

/* ─── Column definitions matching BIMS import format ──────────── */

/**
 * BIMS Households CSV Columns
 *
 * These columns follow the LGUSS-BIMS standard format for household
 * profile data import, matching BIMS Form A1 Part 1 fields.
 */
export const HOUSEHOLD_COLUMNS = [
  'REGION',
  'PROVINCE',
  'CITY_MUNICIPALITY',
  'BARANGAY',
  'SITIO_PUROK',
  'HOUSEHOLD_NO',
  'COMPLETE_ADDRESS',
  'HOUSEHOLD_NAME',
  'HOUSEHOLD_TYPE',
  'HOUSEHOLD_TYPE_OTHER',
  'TENURE_STATUS',
  'TENURE_STATUS_OTHER',
  'HOUSEHOLD_UNIT',
  'HOUSEHOLD_UNIT_OTHER',
  'NO_OF_FAMILIES',
  'NO_OF_MEMBERS',
  'NO_OF_MIGRANTS',
  'MONTHLY_INCOME',
  'WATER_SYSTEM',
  'WASTE_DISPOSAL',
  'POWER_SUPPLY',
  'TOILET_TYPE',
  'DATA_SET',
  'DATE_EXPORTED',
]

/**
 * BIMS Household Members CSV Columns
 *
 * Matches BIMS Form A1 Part 2 — linked to household via HOUSEHOLD_NO.
 */
export const MEMBER_COLUMNS = [
  'HOUSEHOLD_NO',
  'LAST_NAME',
  'FIRST_NAME',
  'MIDDLE_NAME',
  'EXT_NAME',
  'RELATIONSHIP_TO_HEAD',
  'SOURCE_OF_INCOME',
  'MONTHLY_INCOME',
  'SORT_ORDER',
]

/**
 * BIMS Migrants CSV Columns
 *
 * Matches BIMS Form A1 Part 3 — linked to household via HOUSEHOLD_NO.
 */
export const MIGRANT_COLUMNS = [
  'HOUSEHOLD_NO',
  'LAST_NAME',
  'FIRST_NAME',
  'MIDDLE_NAME',
  'EXT_NAME',
  'PREVIOUS_RESIDENCE',
  'LENGTH_OF_STAY_PREVIOUS',
  'REASON_FOR_LEAVING',
  'REASON_FOR_LEAVING_OTHER',
  'DATE_OF_TRANSFER',
  'REASON_FOR_TRANSFERRING',
  'REASON_FOR_TRANSFERRING_OTHER',
  'DURATION_OF_STAY_CURRENT',
  'INTENTION_TO_RETURN',
]

/* ─── BIMS Residents/Inhabitants CSV Columns ──────────────────── */

/**
 * BIMS Residents (Individual/Inhabitant) CSV Columns
 *
 * Follows the RBI Form B (Individual) standard format and BIMS
 * individual profile data requirements for import into LGUSS-BIMS.
 */

export const RESIDENT_COLUMNS = [
  // Classification
  'TYPE_OF_RESIDENT',
  'HOUSEHOLD_NO',
  // Personal Information
  'PHILSYS_CARD_NO',
  'LAST_NAME',
  'FIRST_NAME',
  'MIDDLE_NAME',
  'EXT_NAME',
  'DATE_OF_BIRTH',
  'AGE',
  'PLACE_OF_BIRTH',
  'RESIDENCE_OF_MOTHER_UPON_BIRTH',
  'SEX',
  'GENDER',
  'GENDER_OTHER',
  'CIVIL_STATUS',
  'PREGNANT_WOMAN',
  'HIGHEST_EDUCATIONAL_ATTAINMENT',
  'PROFESSION_OCCUPATION',
  'MOTHER_MAIDEN_FIRST_NAME',
  'MOTHER_MAIDEN_MIDDLE_NAME',
  'MOTHER_MAIDEN_LAST_NAME',
  // Contact Details
  'EMAIL_ADDRESS',
  'MOBILE_NUMBER',
  'TEL_NUMBER',
  // Address
  'REGION',
  'PROVINCE',
  'CITY_MUNICIPALITY',
  'BARANGAY',
  'SITIO_PUROK',
  'HOUSE_BLOCK_LOT_NO',
  'STREET_NAME',
  'SUBDIVISION_VILLAGE',
  'ZIP_CODE',
  // Identity Information
  'BLOOD_TYPE',
  'HEIGHT_M',
  'WEIGHT_KG',
  'COMPLEXION',
  'NATIONALITY',
  'ETHNICITY',
  'RELIGION',
  'RELIGION_OTHER',
  // Voter Info
  'REGISTERED_VOTER',
  'RESIDENT_VOTER',
  'LAST_VOTED_YEAR',
  // Beneficiary Info
  'GOVERNMENT_ASSISTANCE_PROGRAMS',
  'GOVERNMENT_ASSISTANCE_OTHER',
  // Sectoral Info (boolean flags)
  'EMPLOYED',
  'UNEMPLOYED',
  'OFW',
  'INDIGENOUS_PEOPLE',
  'STUDENT',
  'OUT_OF_SCHOOL_CHILDREN',
  'OUT_OF_SCHOOL_YOUTH',
  'MIGRANT',
  'REFUGEE',
  'SENIOR_CITIZEN',
  'PWD',
  'SINGLE_SOLO_PARENT',
  // Consent & Metadata
  'DATA_PRIVACY_CONSENT',
  'CONSENT_SIGNATURE_DATE',
  'IS_DECEASED',
  'DATA_SET',
  'DATE_EXPORTED',
]

/* ─── Generate CSV content ────────────────────────────────────── */

export function generateHouseholdsCsv(
  households: ApiHousehold[],
  _labels?: CsvLabelMaps,
): string {
  let out = csvRow(HOUSEHOLD_COLUMNS)
  const dateExported = todayISO()

  for (const h of households) {
    out += csvRow([
      h.region ?? '',
      h.province ?? '',
      h.city_municipality ?? '',
      h.barangay ?? '',
      h.sitio_purok ?? '',
      h.household_number,
      h.household_complete_address ?? '',
      h.household_name ?? '',
      h.household_type ?? '',
      h.household_type_other ?? '',
      h.tenure_status ?? '',
      h.tenure_status_other ?? '',
      h.household_unit ?? '',
      h.household_unit_other ?? '',
      h.no_of_families ?? 0,
      h.no_of_household_members ?? 0,
      h.no_of_migrants ?? 0,
      h.monthly_income ?? 0,
      h.water_system ?? '',
      h.waste_disposal ?? '',
      h.power_supply ?? '',
      h.toilet_type ?? '',
      h.data_set ?? 'BIPS',
      dateExported,
    ])
  }
  return out
}

export function generateMembersCsv(
  households: ApiHousehold[],
  allMembers: Map<string, ApiHouseholdMember[]>,
  _labels?: CsvLabelMaps,
): string {
  let out = csvRow(MEMBER_COLUMNS)

  for (const h of households) {
    const members = allMembers.get(h.id) ?? []
    for (const m of members) {
      out += csvRow([
        h.household_number,
        m.last_name,
        m.first_name,
        m.middle_name ?? '',
        m.ext_name ?? '',
        m.relationship_to_head,
        m.source_of_income ?? '',
        m.monthly_income ?? 0,
        m.sort_order ?? 0,
      ])
    }
  }
  return out
}

export function generateMigrantsCsv(
  households: ApiHousehold[],
  allMigrants: Map<string, ApiMigrant[]>,
  _labels?: CsvLabelMaps,
): string {
  let out = csvRow(MIGRANT_COLUMNS)

  for (const h of households) {
    const migrants = allMigrants.get(h.id) ?? []
    for (const m of migrants) {
      out += csvRow([
        h.household_number,
        m.last_name,
        m.first_name,
        m.middle_name ?? '',
        m.ext_name ?? '',
        m.previous_residence,
        m.length_of_stay_previous_barangay,
        m.reason_for_leaving,
        m.reason_for_leaving_other ?? '',
        m.date_of_transfer,
        m.reason_for_transferring,
        m.reason_for_transferring_other ?? '',
        m.duration_of_stay_current_barangay,
        m.intention_to_return ? 'Yes' : 'No',
      ])
    }
  }
  return out
}

export function generateResidentsCsv(
  residents: ApiResident[],
  householdNos?: Map<string, string>, // maps resident.id → household_number
): string {
  let out = csvRow(RESIDENT_COLUMNS)
  const dateExported = todayISO()

  for (const r of residents) {
    const hhNo = householdNos?.get(r.id) ?? r.household_id ?? ''
    out += csvRow([
      // Classification
      r.type_of_resident ?? '',
      hhNo,
      // Personal Information
      r.philsys_card_no ?? '',
      r.last_name,
      r.first_name,
      r.middle_name ?? '',
      r.ext_name ?? '',
      r.date_of_birth ?? '',
      r.age ?? '',
      r.place_of_birth ?? '',
      r.residence_of_mother_upon_birth ?? '',
      r.sex ?? '',
      r.gender ?? '',
      r.gender_other ?? '',
      r.civil_status ?? '',
      r.pregnant_woman ? 'Yes' : 'No',
      r.highest_educational_attainment ?? '',
      r.profession_occupation ?? '',
      r.mother_maiden_first_name ?? '',
      r.mother_maiden_middle_name ?? '',
      r.mother_maiden_last_name ?? '',
      // Contact Details
      r.email_address ?? '',
      r.mobile_number ?? '',
      r.tel_number ?? '',
      // Address
      r.region ?? '',
      r.province ?? '',
      r.city_municipality ?? '',
      r.barangay ?? '',
      r.sitio_purok ?? '',
      r.house_block_lot_no ?? '',
      r.street_name ?? '',
      r.subdivision_village ?? '',
      r.zip_code ?? '',
      // Identity Information
      r.blood_type ?? '',
      r.height_m ?? '',
      r.weight_kg ?? '',
      r.complexion ?? '',
      r.nationality ?? '',
      r.ethnicity ?? '',
      r.religion ?? '',
      r.religion_other ?? '',
      // Voter Info
      r.registered_voter ? 'Yes' : 'No',
      r.resident_voter ? 'Yes' : 'No',
      r.last_voted_year ?? 0,
      // Beneficiary Info
      (r.government_assistance_programs ?? []).join('; '),
      r.government_assistance_other ?? '',
      // Sectoral Info
      r.employed ? 'Yes' : 'No',
      r.unemployed ? 'Yes' : 'No',
      r.ofw ? 'Yes' : 'No',
      r.indigenous_people ? 'Yes' : 'No',
      r.student ? 'Yes' : 'No',
      r.out_of_school_children ? 'Yes' : 'No',
      r.out_of_school_youth ? 'Yes' : 'No',
      r.migrant ? 'Yes' : 'No',
      r.refugee ? 'Yes' : 'No',
      r.senior_citizen ? 'Yes' : 'No',
      r.pwd ? 'Yes' : 'No',
      r.single_solo_parent ? 'Yes' : 'No',
      // Consent & Metadata
      r.data_privacy_consent ? 'Yes' : 'No',
      r.consent_signature_date ?? '',
      r.is_deceased ? 'Yes' : 'No',
      r.data_set ?? 'BIPS',
      dateExported,
    ])
  }
  return out
}

/* ─── Trigger CSV file download ───────────────────────────────── */

export function downloadCsv(filename: string, content: string) {
  const BOM = '﻿' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
