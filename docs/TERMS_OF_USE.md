# Terms of Use for Barangay Staff

**BarangayOS — Barangay Records Management System**

*Version 1.0 — July 2026*

---

## 1. Purpose and Scope

These Terms of Use ("Terms") govern your access to and use of **BarangayOS**, the digital records management system operated by your Barangay LGU. These Terms apply to all users of the system, including:

- **Admins** — IT administrators and Barangay Captains with full system access
- **Staff** — Barangay secretaries, office staff, and personnel who create and update records
- **Viewers** — Councilors, auditors, and other authorized personnel with read-only access

By accessing the system, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must not use the system and should inform the Barangay Captain or System Administrator immediately.

---

## 2. Account and Access

2.1 **Account Credentials.** You will be issued a unique user account with an email address and password. You are responsible for:
   - Maintaining the confidentiality of your password
   - All activities that occur under your account
   - Immediately reporting any unauthorized use of your account to the System Administrator

2.2 **Password Requirements.** Passwords must be at least 8 characters long. You must not share your password with anyone, including colleagues or supervisors. System administrators can reset passwords but cannot retrieve them — passwords are hashed using bcrypt and are never stored in plaintext.

2.3 **Session Security.** Your session will automatically expire after a period of inactivity. You must log out of the system at the end of each work session, especially on shared or public computers.

2.4 **Account Revocation.** Your access may be revoked or modified at any time by the System Administrator or Barangay Captain, including when your role changes or your employment/assignment ends.

---

## 3. User Roles and Permissions

Your access to system features is determined by your assigned role:

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access — create, read, update, and delete all records; manage user accounts; configure system settings; access all modules |
| **Staff** | Create and update records in most modules (residents, documents, blotter, households, etc.); limited delete capability; no user management |
| **Viewer** | Read-only access to most modules (dashboard, residents, documents, calendar, blotter, reports); cannot create, update, or delete records |

3.1 You must not attempt to access features or data outside your authorized role. The system enforces permissions on the server side — attempting to bypass front-end restrictions is a violation of these Terms and may result in disciplinary action.

3.2 If you believe you need additional access, submit a request through the Barangay Captain or System Administrator. Do not share accounts or use another user's credentials to gain elevated access.

---

## 4. Acceptable Use

4.1 **Authorized Purpose Only.** You may use BarangayOS only for official Barangay business. Personal use of the system is prohibited.

4.2 **Data Accuracy.** You must:
   - Enter data accurately and completely to the best of your knowledge
   - Update records promptly when information changes
   - Verify information before submission where possible
   - Not knowingly enter false or misleading information

4.3 **Record Integrity.** Do not alter or delete records in a way that conceals errors, circumvents audit trails, or misrepresents official Barangay records. If a correction is needed:
   - Use the edit function rather than deleting and re-creating records
   - Include appropriate notes or documentation explaining the correction
   - Rely on the system's activity logs to record your actions

4.4 **Document and Blotter Records.** When processing document requests or blotter records:
   - Handle all personal data with care and confidentiality
   - Process requests in the order they are received (queue-based)
   - Record actions taken accurately
   - Follow the Barangay's established procedures for release and settlement

---

## 5. Confidentiality and Data Protection

5.1 **Confidential Information.** Personal data in BarangayOS is confidential. You must not:
   - Disclose personal data to unauthorized persons
   - Discuss resident information outside of official work contexts
   - Remove data from the system through screenshots, photographs, or copying
   - Download or export data for personal use
   - Share your screen or account access with unauthorized individuals

5.2 **Data Privacy Obligations.** As a user of the system, you are a data processor under the supervision of the Barangay as data controller. You must:
   - Comply with the Data Privacy Act of 2012 (RA 10173)
   - Follow the Barangay's privacy policies and procedures
   - Report any suspected data breach or privacy incident immediately to the Barangay Secretary or System Administrator

5.3 **Exporting Data.** The system includes export and reporting features. You may:
   - Export data only for legitimate official purposes
   - Secure exported files with appropriate protections (encrypted storage, access controls)
   - Delete exported data when it is no longer needed for the official purpose

5.4 **Offline Use.** The system may cache pending changes in your browser's IndexedDB when the network is unavailable. This data is stored temporarily on the device you are using and is automatically synced when connectivity is restored. You must:
   - Not use offline features on public or shared devices
   - Clear browser data after using the system on a non-personal device
   - Understand that cached data may include personal information about residents

---

## 6. Prohibited Activities

The following activities are strictly prohibited:

| Prohibited Activity | Examples |
|---------------------|----------|
| Unauthorized access | Attempting to access data beyond your role, using another user's account |
| Data misuse | Using resident data for personal benefit, harassment, or unauthorized purposes |
| Data destruction | Malicious deletion or alteration of records, attempting to circumvent audit logs |
| System abuse | Attempting to compromise system security, introducing malware, performing unauthorized scans |
| Sharing credentials | Sharing passwords, logging in as another user, creating shared accounts |
| Excessive exports | Downloading large volumes of data without legitimate official need |
| Circumventing security | Bypassing authentication, modifying client-side code to access restricted features, tampering with API requests |

Violations may result in disciplinary action, including suspension of access, administrative sanctions, civil liability, and criminal prosecution under applicable laws including the Data Privacy Act (RA 10173) and the Cybercrime Prevention Act (RA 10175).

---

## 7. Activity Logging and Monitoring

7.1 **All actions are logged.** BarangayOS automatically records all create, update, and delete operations in the **Activity Logs** collection. Each log entry includes:
   - The action performed (create, update, delete)
   - The collection and record affected
   - A description of the change
   - Your user name
   - The timestamp

7.2 **Financial actions are separately audited.** All financial operations (revenues, disbursements, fund source changes) are additionally recorded in the **Finance Audit Logs**, including the monetary amount involved.

7.3 System Administrators may review activity logs at any time to ensure compliance with these Terms. You have no expectation of privacy in your use of the system.

---

## 8. Data Retention and Disposal

8.1 Data in the system is retained according to the Barangay's record retention schedule and applicable laws. You must not delete records that have statutory retention requirements.

8.2 When records reach the end of their retention period, only authorized administrators may delete or anonymize them. Individual staff must not delete records outside the scope of their normal data management duties.

---

## 9. Limitations of Liability

9.1 BarangayOS is provided "as is." The Barangay makes no warranties regarding the system's availability, accuracy, or fitness for a particular purpose.

9.2 The Barangay is not liable for:
   - Damages arising from unauthorized access due to your failure to protect your credentials
   - Data loss resulting from your actions that violate these Terms
   - Indirect or consequential damages arising from system use

9.3 You remain personally accountable for actions taken under your account that violate these Terms or applicable laws.

---

## 10. Incident Reporting

You must report the following immediately to the Barangay Secretary or System Administrator:

- Actual or suspected data breaches or unauthorized access
- Lost or stolen passwords
- Suspicious system behavior or security vulnerabilities
- Accidental disclosure of personal data
- Lost or stolen devices used to access the system

Reports should include the date, time, a description of the incident, and any actions taken.

---

## 11. Amendments

These Terms may be updated by the Barangay from time to time. Users will be notified of material changes. Continued use of the system after changes take effect constitutes acceptance of the updated Terms.

---

## 12. Acceptance

By logging into BarangayOS, you acknowledge and agree to these Terms of Use. If you have questions about these Terms, contact the Barangay Secretary or System Administrator before using the system.

---

*This document is a template. Each Barangay should review and adapt it to their specific deployment, consult their legal counsel, and have it approved by the appropriate authority.*
