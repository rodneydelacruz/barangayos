/**
 * BIMS Form A1: Household Profile Export
 *
 * Generates a print-optimized HTML document following the DILG LGUSS-BIMS
 * standardized household profiling form structure:
 *   Part 1 — Household Geographic & General Information
 *   Part 2 — Household Members Listing
 *   Part 3 — Migrant Information
 *
 * The document is opened in a new window and triggers the browser's print
 * dialog so the user can Save as PDF.
 */

import type { ApiHousehold } from '@/api/households'
import type { ApiHouseholdMember } from '@/api/householdMembers'
import type { ApiMigrant } from '@/api/migrantInfo'

export interface BimsExportData {
  household: ApiHousehold
  members: ApiHouseholdMember[]
  migrants: ApiMigrant[]
  relationshipLabels?: Map<string, string>
  incomeLabels?: Map<string, string>
  leavingLabels?: Map<string, string>
  transferringLabels?: Map<string, string>
}

export function exportBimsFormA1(data: BimsExportData) {
  const { household, members, migrants, relationshipLabels, incomeLabels } = data

  const rel = (code: string) => relationshipLabels?.get(code) ?? code
  const inc = (code?: string) => (code && incomeLabels?.get(code)) ?? code ?? '—'

  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BIMS Form A1 — Household Profile</title>
<style>
  @page { size: legal portrait; margin: 12mm 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.35; padding: 0; }

  /* ── Header ── */
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6pt; margin-bottom: 8pt; }
  .header .rep { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5pt; }
  .header .office { font-size: 9pt; font-weight: bold; margin-top: 2pt; }
  .header .form-ref { font-size: 8pt; font-weight: bold; color: #222; margin-top: 1pt; }
  .header .mc-ref { font-size: 7.5pt; color: #444; margin-top: 1pt; }

  /* ── Form Title ── */
  .form-title { text-align: center; font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 10pt 0 6pt; padding: 3pt 0; border-bottom: 1px solid #000; }

  /* ── Section Headers ── */
  .section-title { font-size: 10pt; font-weight: bold; margin: 8pt 0 4pt; padding: 2pt 5pt; background: #e8e8e8; border: 1px solid #999; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 6pt; }
  th, td { border: 1px solid #000; padding: 2pt 4pt; text-align: left; font-size: 9pt; vertical-align: top; }
  th { background: #f0f0f0; font-weight: bold; text-align: center; }
  .field-label { font-weight: bold; width: 32%; background: #f8f8f8; }
  .field-value { width: 68%; }

  /* ── Compact / wide variant ── */
  .field-label-wide { font-weight: bold; width: 28%; background: #f8f8f8; }
  .field-value-wide { width: 22%; }

  /* ── PSGC Codes Row ── */
  .psgc-table td { font-size: 8pt; text-align: center; }

  /* ── Meta Row ── */
  .meta-row { background: #f0f0f0; font-size: 8pt; text-align: center; }

  /* ── Signatures ── */
  .sig-section { margin-top: 16pt; border-top: 1px solid #000; padding-top: 4pt; }
  .sig-grid { display: flex; justify-content: space-between; gap: 12pt; margin-top: 8pt; }
  .sig-box { text-align: center; flex: 1; }
  .sig-box .label { font-size: 8pt; font-weight: bold; }
  .sig-box .line { border-top: 1px solid #000; margin-top: 32pt; padding-top: 2pt; font-size: 8pt; }
  .sig-box .sub { font-size: 7.5pt; color: #555; font-style: italic; }
  .sig-box .date-line { margin-top: 8pt; font-size: 7.5pt; border-top: 1px solid #000; padding-top: 2pt; }

  /* ── Footer ── */
  .footer { text-align: center; font-size: 7pt; color: #666; margin-top: 12pt; border-top: 1px solid #ccc; padding-top: 4pt; }

  /* ── Buttons (screen only) ── */
  @media screen {
    .no-print { text-align: right; margin-bottom: 8pt; }
    .no-print button { padding: 5pt 14pt; font-size: 10pt; cursor: pointer; margin-left: 4pt; border: 1px solid #999; background: #fff; border-radius: 3pt; }
    .no-print button:hover { background: #eee; }
  }
  @media print {
    .no-print { display: none; }
    body { padding: 0; }
    .sig-box .line { margin-top: 36pt; }
  }
</style>
</head>
<body>

<div class="no-print">
  <button onclick="window.print()">🖨️ Print / Save as PDF</button>
  <button onclick="window.close()">✕ Close</button>
</div>

<!-- ─── HEADER ─────────────────────────────────────────────────── -->
<div class="header">
  <div class="rep">Republic of the Philippines</div>
  <div class="office">Barangay Information Management System (BIMS)</div>
  <div class="form-ref">BIMS FORM A1 — HOUSEHOLD PROFILE</div>
  <div class="mc-ref">DILG MC No. 2025-104 | LGUSS-BIMS Standard Household Profiling</div>
</div>

<!-- ─── FORM META: Date / Data Set / Enumerator ──────────────── -->
<table style="margin-bottom:8pt;">
  <tr>
    <td style="width:25%;font-weight:bold;font-size:8pt;border:none;">Date Accomplished:</td>
    <td style="width:25%;font-size:8pt;border:none;"><strong>${esc(today)}</strong></td>
    <td style="width:25%;font-weight:bold;font-size:8pt;border:none;">Data Set / Source:</td>
    <td style="width:25%;font-size:8pt;border:none;"><strong>${esc(household.data_set || 'BIPS')}</strong></td>
  </tr>
  <tr>
    <td style="font-weight:bold;font-size:8pt;border:none;">Enumerator:</td>
    <td style="font-size:8pt;border:none;"><u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></td>
    <td style="font-weight:bold;font-size:8pt;border:none;">Date Encoded:</td>
    <td style="font-size:8pt;border:none;">${esc(today)}</td>
  </tr>
</table>

<!-- ─── PSGC CODES ────────────────────────────────────────────── -->
<div class="section-title">PSGC Codes &amp; Geographic Classification</div>
<table class="psgc-table">
  <tr>
    <th style="width:20%;">Level</th>
    <th style="width:40%;">Name</th>
    <th style="width:40%;">PSGC Code</th>
  </tr>
  <tr>
    <td><strong>Region</strong></td>
    <td>${esc(household.region || '—')}</td>
    <td><u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></td>
  </tr>
  <tr>
    <td><strong>Province</strong></td>
    <td>${esc(household.province || '—')}</td>
    <td><u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></td>
  </tr>
  <tr>
    <td><strong>City / Municipality</strong></td>
    <td>${esc(household.city_municipality || '—')}</td>
    <td><u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></td>
  </tr>
  <tr>
    <td><strong>Barangay</strong></td>
    <td>${esc(household.barangay || '—')}</td>
    <td><u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></td>
  </tr>
</table>

<!-- ─── PART 1: HOUSEHOLD GEOGRAPHIC & GENERAL INFO ──────────── -->
<div class="form-title">Part 1 — Household Geographic &amp; General Information</div>

<table>
  <tr><td class="field-label">Household Number (HHN)</td><td class="field-value"><strong>${esc(household.household_number)}</strong></td></tr>
  <tr><td class="field-label">Sitio / Purok</td><td class="field-value">${esc(household.sitio_purok || '—')}</td></tr>
  <tr><td class="field-label">Complete Address</td><td class="field-value">${esc(household.household_complete_address || '—')}</td></tr>
  <tr><td class="field-label">Household Name (Head of Household)</td><td class="field-value"><strong>${esc(household.household_name || '—')}</strong></td></tr>
  <tr><td class="field-label">Household Type</td><td class="field-value">${esc(household.household_type || '—')}${household.household_type_other ? ' (' + esc(household.household_type_other) + ')' : ''}</td></tr>
  <tr><td class="field-label">Tenure Status</td><td class="field-value">${esc(household.tenure_status || '—')}${household.tenure_status_other ? ' (' + esc(household.tenure_status_other) + ')' : ''}</td></tr>
  <tr><td class="field-label">Household Unit / Structure</td><td class="field-value">${esc(household.household_unit || '—')}${household.household_unit_other ? ' (' + esc(household.household_unit_other) + ')' : ''}</td></tr>
  <tr><td class="field-label">Number of Families in the Household</td><td class="field-value">${household.no_of_families ?? '—'}</td></tr>
  <tr><td class="field-label">Number of Household Members</td><td class="field-value">${household.no_of_household_members ?? '—'}</td></tr>
  <tr><td class="field-label">Number of Migrants (OFW / Previous Residents)</td><td class="field-value">${household.no_of_migrants ?? '—'}</td></tr>
  <tr><td class="field-label">Monthly Household Income (PHP)</td><td class="field-value">${household.monthly_income != null ? 'PHP ' + Number(household.monthly_income).toLocaleString() : '—'}</td></tr>
</table>

<!-- ─── NATIONAL INDICATORS ──────────────────────────────────── -->
<div class="section-title">National Indicators (DILG MC No. 2025-104)</div>
<table>
  <tr>
    <td class="field-label">Water System</td>
    <td class="field-value">${esc(household.water_system || '—')}</td>
  </tr>
  <tr>
    <td class="field-label">Waste Disposal</td>
    <td class="field-value">${esc(household.waste_disposal || '—')}</td>
  </tr>
  <tr>
    <td class="field-label">Power Supply</td>
    <td class="field-value">${esc(household.power_supply || '—')}</td>
  </tr>
  <tr>
    <td class="field-label">Toilet Type</td>
    <td class="field-value">${esc(household.toilet_type || '—')}</td>
  </tr>
</table>

<!-- ─── PART 2: HOUSEHOLD MEMBERS ─────────────────────────────── -->
<div class="form-title">Part 2 — Household Members (List of All Members)</div>

<table>
  <thead>
    <tr>
      <th style="width:4%;">#</th>
      <th style="width:22%;">Last Name</th>
      <th style="width:18%;">First Name</th>
      <th style="width:15%;">Middle Name</th>
      <th style="width:8%;">Ext.</th>
      <th style="width:14%;">Relationship to Head</th>
      <th style="width:19%;">Source of Income</th>
    </tr>
  </thead>
  <tbody>
    ${members.length === 0
      ? '<tr><td colspan="7" style="text-align:center;font-style:italic;">No household members recorded.</td></tr>'
      : members.map((m, i) => `
    <tr>
      <td style="text-align:center;">${i + 1}</td>
      <td>${esc(m.last_name)}</td>
      <td>${esc(m.first_name)}</td>
      <td>${esc(m.middle_name || '—')}</td>
      <td>${esc(m.ext_name || '—')}</td>
      <td>${esc(rel(m.relationship_to_head))}</td>
      <td>${inc(m.source_of_income)}</td>
    </tr>`).join('')}
  </tbody>
</table>

<!-- Member Income Detail -->
${members.some(m => m.monthly_income != null && m.monthly_income > 0) ? `
<table>
  <caption style="font-size:8pt;font-weight:bold;text-align:left;margin-bottom:2pt;">Individual Monthly Income of Members</caption>
  <thead>
    <tr>
      <th style="width:4%;">#</th>
      <th style="width:48%;">Full Name</th>
      <th style="width:48%;">Monthly Income (PHP)</th>
    </tr>
  </thead>
  <tbody>
    ${members.filter(m => m.monthly_income != null && m.monthly_income > 0).map((m, i) => `
    <tr>
      <td style="text-align:center;">${i + 1}</td>
      <td>${esc(m.last_name)}, ${esc(m.first_name)} ${esc(m.middle_name || '')} ${esc(m.ext_name || '')}</td>
      <td style="text-align:right;">PHP ${Number(m.monthly_income).toLocaleString()}</td>
    </tr>`).join('')}
  </tbody>
</table>
` : ''}

<!-- ─── PART 3: MIGRANT INFORMATION ──────────────────────────── -->
<div class="form-title">Part 3 — Migrant Information</div>

${migrants.length === 0 ? `
<p style="text-align:center;font-style:italic;padding:10pt 0;border:1px solid #999;">No migrant records for this household.</p>
` : `
<table>
  <thead>
    <tr>
      <th style="width:3%;">#</th>
      <th style="width:13%;">Full Name</th>
      <th style="width:15%;">Previous Residence</th>
      <th style="width:9%;">Length of Stay (Prev.)</th>
      <th style="width:14%;">Reason for Leaving</th>
      <th style="width:11%;">Date of Transfer</th>
      <th style="width:14%;">Reason for Transferring</th>
      <th style="width:8%;">Duration Here</th>
      <th style="width:6%;">Intend to Return?</th>
    </tr>
  </thead>
  <tbody>
    ${migrants.map((m, i) => `
    <tr>
      <td style="text-align:center;">${i + 1}</td>
      <td><strong>${esc(m.last_name)}</strong>, ${esc(m.first_name)}</td>
      <td>${esc(m.previous_residence)}</td>
      <td style="text-align:center;">${esc(m.length_of_stay_previous_barangay)}</td>
      <td>${esc(m.reason_for_leaving)}${m.reason_for_leaving_other ? '<br><em>Specify: ' + esc(m.reason_for_leaving_other) + '</em>' : ''}</td>
      <td style="text-align:center;">${esc(m.date_of_transfer)}</td>
      <td>${esc(m.reason_for_transferring)}${m.reason_for_transferring_other ? '<br><em>Specify: ' + esc(m.reason_for_transferring_other) + '</em>' : ''}</td>
      <td style="text-align:center;">${esc(m.duration_of_stay_current_barangay)}</td>
      <td style="text-align:center;">${m.intention_to_return ? 'Yes' : 'No'}</td>
    </tr>`).join('')}
  </tbody>
</table>
`}

<!-- ─── DATA QUALITY / CONTROL INFO ──────────────────────────── -->
<div class="section-title">Data Control &amp; Quality Assurance</div>
<table>
  <tr>
    <td style="width:25%;font-weight:bold;background:#f8f8f8;">Form Version</td>
    <td style="width:25%;">BIMS A1 v1.0</td>
    <td style="width:25%;font-weight:bold;background:#f8f8f8;">Data Set Identifier</td>
    <td style="width:25%;">${esc(household.data_set || 'BIPS')}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;background:#f8f8f8;">Number of Pages</td>
    <td>—</td>
    <td style="font-weight:bold;background:#f8f8f8;">Date Exported</td>
    <td>${esc(today)}</td>
  </tr>
</table>

<!-- ─── SIGNATURES ────────────────────────────────────────────── -->
<div class="sig-section">
  <div class="sig-grid">
    <div class="sig-box">
      <div class="label">Prepared by:</div>
      <div class="line">
        <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u><br>
        <span class="sub">Signature over Printed Name of Household Head / Member</span>
      </div>
      <div class="date-line">Date: _______________</div>
    </div>
    <div class="sig-box">
      <div class="label">Certified Correct by:</div>
      <div class="line">
        <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u><br>
        <span class="sub"><strong>Barangay Secretary</strong><br>Printed Name &amp; Signature</span>
      </div>
      <div class="date-line">Date: _______________</div>
    </div>
    <div class="sig-box">
      <div class="label">Validated by:</div>
      <div class="line">
        <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u><br>
        <span class="sub"><strong>Punong Barangay</strong><br>Printed Name &amp; Signature</span>
      </div>
      <div class="date-line">Date: _______________</div>
    </div>
  </div>
</div>

<!-- Signature for Encoding -->
<div style="margin-top:10pt;border-top:1px solid #999;padding-top:4pt;display:flex;justify-content:center;gap:40pt;">
  <div style="text-align:center;">
    <div style="font-size:8pt;font-weight:bold;">Encoded by:</div>
    <div style="border-top:1px solid #000;margin-top:24pt;padding-top:2pt;font-size:8pt;">
      <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u><br>
      <span style="font-size:7pt;color:#555;">Signature over Printed Name</span>
    </div>
  </div>
  <div style="text-align:center;">
    <div style="font-size:8pt;font-weight:bold;">Verified / Spot-checked by:</div>
    <div style="border-top:1px solid #000;margin-top:24pt;padding-top:2pt;font-size:8pt;">
      <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u><br>
      <span style="font-size:7pt;color:#555;">Signature over Printed Name of MPDC / Planner</span>
    </div>
  </div>
</div>

<div class="footer">
  <strong>BarangayOS</strong> — LGUSS-BIMS Compliant | Generated ${esc(today)}
  <br>This form complies with DILG Memorandum Circular No. 2025-104
</div>

<script>
  setTimeout(function() { window.print(); }, 500);
</script>

</body>
</html>`

  // Open in a new window
  const win = window.open('', '_blank')
  if (!win) {
    alert('Popup blocked. Please allow popups for this site to export.')
    return
  }
  win.document.write(html)
  win.document.close()
}

function esc(s: unknown): string {
  if (s == null) return '—'
  const str = String(s)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
