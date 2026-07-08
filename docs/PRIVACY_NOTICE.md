# Privacy Notice for Residents

**BarangayOS — Barangay Records Management System**

*Version 1.0 — July 2026*

---

## 1. Who We Are

This Privacy Notice explains how your personal information is collected, used, stored, and protected when the Barangay processes your data through **BarangayOS**, the digital records management system used by your Barangay Local Government Unit (LGU).

**Data Controller:** The Barangay LGU operating this installation of BarangayOS.

**Contact:** Your Barangay Hall — ask for the Barangay Secretary or Barangay Captain.

This Notice applies to all residents, visitors, complainants, and document applicants whose personal data is recorded in the system. It supplements, and does not replace, the Barangay's existing privacy and data protection policies.

---

## 2. What Personal Data We Collect

The BarangayOS system stores the following categories of personal data. Most are provided directly by you when you transact with the Barangay; some are recorded by Barangay staff in the course of their official duties.

### 2.1 Resident Profile Data

When you register as a resident or update your profile, we collect:

| Data | Purpose |
|------|---------|
| Full name (first, last, middle, suffix) | Identification, official records, document issuance |
| Birth date and age | Demographic profiling, statutory benefits (senior citizen, voter eligibility) |
| Gender | Demographic profiling, planning |
| Contact number | Official communication |
| Civil status | Legal records, demographic profiling |
| Purok / zone assignment | Service delivery, zone-based planning |
| Occupation | Socioeconomic profiling |
| Nationality | Identification |
| Blood type | Emergency response, health data |
| Household affiliation | Family/household-based planning and services |
| Voter status | Election-related services |
| 4Ps beneficiary status | Social welfare coordination |
| Senior citizen status | Statutory benefits administration |
| PWD (Person with Disability) status | Disability services and accessibility planning |
| Deceased status | Records maintenance |
| Free-text notes | Contextual information recorded by staff |

### 2.2 Document Request Data

When you request a Barangay document (clearance, permit, certificate, etc.):

- Your name and contact details
- Document type requested
- Purpose of the request
- Payment status, amount, and official receipt number
- Identity of the person who received the document

### 2.3 Blotter / Complaint Records

If you are a party to a complaint or incident report:

- Complainant and respondent names and contact numbers
- Incident type, date, and location
- Narrative description of the incident
- Action taken and involved parties

### 2.4 Visitor Log Data

When you visit the Barangay Hall:

- Your name
- Contact number
- Purpose of visit
- Person you are visiting
- Time in and time out

### 2.5 Special Categories of Data

Some data we process is considered sensitive under the Data Privacy Act (RA 10173):

- **Blood type** (medical data)
- **Disability status** (PWD — health/disability information)
- **4Ps beneficiary status** (socioeconomic data indicating government assistance)
- **Incident narratives** in blotter records (may contain highly personal information)

We process this data only with your consent or when necessary for the Barangay's lawful functions.

---

## 3. How We Collect Your Data

We collect personal data in the following ways:

1. **Directly from you** — when you visit the Barangay Hall, fill out forms, submit document requests, file complaints, or sign the visitor log.
2. **From Barangay staff** — when staff record information during official duties (e.g., profiling, census, complaint intake).
3. **From family or household members** — household heads may provide information about household members during registration.

---

## 4. Legal Basis for Processing

We process your personal data under the following lawful bases under the Data Privacy Act of 2012 (Republic Act No. 10173):

| Basis | Application |
|-------|-------------|
| **Section 12(a) — Consent** | Optional data (blood type, notes); you may decline |
| **Section 12(b) — Contractual necessity** | Document requests, financial transactions |
| **Section 12(c) — Legal obligation** | Blotter records, official reporting, statutory compliance |
| **Section 12(e) — Public function** | Resident profiling, planning, service delivery by the Barangay as a government unit |
| **Section 12(f) — Legitimate interest** | Visitor logs for security, activity auditing |

---

## 5. How We Use Your Data

Your data is used exclusively for the Barangay's lawful government functions:

- Maintaining the official Barangay registry of residents
- Processing document requests (clearances, permits, certifications)
- Recording and resolving complaints and disputes (blotter)
- Visitor management and security at the Barangay Hall
- Planning and budgeting for Barangay services
- Compliance with statutory reporting requirements (e.g., DILG, COA)
- Issuing official receipts and financial record-keeping
- Coordinating with national government programs (e.g., 4Ps, senior citizen benefits, PWD registration)

**We do not** sell your personal data, use it for marketing, or share it for purposes unrelated to the Barangay's official functions.

---

## 6. Data Sharing and Disclosure

We may share your data only in the following circumstances:

| Recipient | Purpose |
|-----------|---------|
| **Barangay officials and staff** | Operational use within their assigned duties |
| **Government agencies (DILG, DSWD, PSA, COA, etc.)** | Statutory reporting, program coordination |
| **Law enforcement and courts** | Legal process, subpoena, court order |
| **Cloudinary** | Image storage for asset photos (optional; only if configured) |

**International data transfers:** If Cloudinary is configured, asset images may be stored on servers outside the Philippines. All other data remains on the Barangay's own server within the Philippines.

---

## 7. Data Storage and Retention

### Where Your Data Is Stored

- **Primary storage:** PocketBase (SQLite database) running on a server physically located within the Barangay or hosted in the Philippines.
- **Offline queue (temporary):** When network connectivity is unavailable, recent changes are cached in your browser's IndexedDB and synced when connectivity is restored. This data is stored only until the sync completes.
- **Image storage (optional):** Cloudinary cloud servers (if configured by your Barangay).

### Retention Periods

| Data Type | Retention Period |
|-----------|------------------|
| Resident profiles | Indefinite (permanent official registry) |
| Document requests | 5 years from date of request |
| Blotter records | 10 years from final disposition |
| Visitor logs | 1 year from date of visit |
| Activity logs | 3 years |
| Finance records | 10 years (COA retention requirement) |
| Offline queue data | Until successfully synced to server |

Data is retained in accordance with applicable laws, regulations, and the Barangay's record retention schedule. Data no longer needed is deleted or anonymized.

---

## 8. Data Security Measures

The BarangayOS system implements the following security measures:

### Technical Measures
- **Encryption at rest:** Session data encrypted via PocketBase's configurable encryption key (`PB_ENCRYPTION_KEY`)
- **Encryption in transit:** HTTPS (TLS) through Cloudflare Tunnel or direct TLS configuration
- **Access controls:** Role-based access control (RBAC) with three tiers — admin, staff, viewer
- **Authentication:** Email/password with bcrypt password hashing; session tokens with configurable expiry (5 days default)
- **Server-side rule enforcement:** Database-level authorization rules — users cannot bypass frontend restrictions
- **Audit trails:** All create, update, and delete operations are logged in activity logs and finance audit logs
- **Network protection:** Cloudflare WAF (Web Application Firewall) when using Cloudflare Tunnel deployment

### Organizational Measures
- Password minimum length of 8 characters
- Login alerts for new locations
- Configurable password reset and email verification
- Staff are bound by confidentiality obligations (see Terms of Use)

---

## 9. Your Rights Under the Data Privacy Act

Under Republic Act No. 10173 (Data Privacy Act of 2012), you have the following rights regarding your personal data:

| Right | What It Means |
|-------|---------------|
| **Right to be informed** | You have the right to know what data is collected and how it is used — this Notice fulfills this right |
| **Right to access** | You may request a copy of your personal data held by the Barangay |
| **Right to object** | You may object to the processing of your data, subject to legal and regulatory limitations |
| **Right to erasure / blocking** | You may request deletion or blocking of your data, subject to retention requirements under law |
| **Right to rectify** | You may request correction of inaccurate or incomplete data |
| **Right to data portability** | You may request your data in a commonly used electronic format |
| **Right to damages** | You may claim compensation if you suffer damages due to violation of your data privacy rights |

### How to Exercise Your Rights

Submit a written request at the Barangay Hall addressed to the **Barangay Secretary**. Include:

1. Your full name and valid identification
2. A clear description of the data concerned
3. The specific right you wish to exercise
4. Your signature and date

We will respond within **15 working days** as required by NPC Advisory No. 2020-01.

---

## 10. Data Breach Notification

If your personal data is involved in a security breach that poses a real risk of harm, we will notify you and the National Privacy Commission (NPC) within **72 hours** of becoming aware of the breach, as required by the Data Privacy Act and NPC Circular 16-03.

---

## 11. Contact Information

### Barangay Data Protection Officer / Contact Person

For privacy-related inquiries, concerns, or to exercise your rights, contact:

**Barangay Secretary** (or the designated Data Protection Officer)
- **Visit:** Your Barangay Hall
- **Phone:** The Barangay's official contact number

### National Privacy Commission

If your concern is not resolved by the Barangay, you may file a complaint with:

**National Privacy Commission (NPC)**
5th Floor, Philippine International Convention Center (PICC)
Pasay City, Philippines
[www.privacy.gov.ph](https://www.privacy.gov.ph)
NPC Complaint Hotline: (02) 8234-2222

---

## 12. Updates to This Notice

This Privacy Notice may be updated periodically to reflect changes in the system, applicable laws, or NPC regulations. The current version is always available from the Barangay Secretary or posted at the Barangay Hall. Significant changes will be announced through the Barangay's usual communication channels.

The system is built on **BarangayOS**, an open-source project available at [github.com/rodneydelacruz/barangay-system](https://github.com/rodneydelacruz/barangay-system). Each Barangay runs its own independent installation and is solely responsible for the data it processes.

---

*This Privacy Notice is provided as a template. Each Barangay should review and adapt it to their specific deployment, consult their legal counsel, and have it approved by the Sangguniang Barangay as needed.*
