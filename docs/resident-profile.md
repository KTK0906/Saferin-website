# Shared resident profile

The existing Add Elderly drawer and Profile → Edit Profile use `ElderlyFormDialog.vue`. The personal-information form is generated from the same source rather than maintaining a second profile.

## Use

1. In Elderly List, choose Add Elderly. Name, zone and bed are required; other details can be completed later. Sections cover basic information, admission, contacts, medical information and personal background/relatives.
2. Record date of birth when known; age is calculated from it. Otherwise an optional recorded age is supported. Admission date is separate from the database creation timestamp.
3. Profile → Overview displays the same saved information. Edit Profile opens the shared drawer and updates the page without a full reload.
4. Choose Create Form → 院友個人資料表. It displays a snapshot of the shared profile. “修改院友資料” opens the shared editor; a new draft refreshes after saving while retaining its author, date, status and notes.
5. Saved forms preserve history. When current profile data differs, a comparison is shown. Updating an existing form from the current profile requires explicit confirmation and Save Record. It does not rewrite other forms.

Older forms without a profile snapshot remain viewable/editable with their original fields. No historical answers are automatically copied into the current profile. There were no existing form-14 records when this change was applied; no conflicting records required migration.

## Storage

| Data | Existing table / additions |
| --- | --- |
| Name, recorded age, gender, care level, zone, bed | `elderly` existing columns |
| DOB, admission date, room, resident number, HKID, marital status | New typed columns on `elderly` |
| Personal background, habits and relatives | `elderly.personal_details` JSONB using the existing form-14 schema |
| Primary/secondary/doctor contact | Existing `emergency_contacts` fields; relationship and phone columns added |
| Conditions, allergies, medications | Existing `medical_information` fields |
| Historical form contents | Existing `elderly_form_records.payload`, including `residentSnapshot` and `profileSnapshot` |

`save_resident_profile` writes resident, contacts and medical information in one database transaction, with caller permissions and RLS. A related-write failure rolls back the full operation. Updating requires the version read when opening the editor; stale updates fail and retain the user's input for review. The existing table's timestamp trigger uses transaction time, so rollback-only SQL tests supply an explicitly older version to model a stale browser request.

Profile tables require an active account with Elderly List read/write permissions, including per-role changes configured in System Settings. The resident picker used by Family Visits and Historical Sensor Data uses `resident_directory`, returning only ID, name and zone for authorized accounts. Its restricted implementation is in a private schema; anonymous access is denied.

## Verification

- `npm run typecheck`
- `npm run build`
- `node tests/resident-profile.cjs`: DOB age, personal-form mappings, snapshots, differences, clear/cancel isolation, editor create/edit, preservation of contacts/health, failed-save retention and permissions.
- `node tests/resident-forms.cjs`: all 24 types and existing form workflows.
- `tests/resident-profile-rls.sql`: real database transaction testing create/edit, optional age, calculated age, rollback of partial failures, version checks, historical snapshot preservation, permission revocation and restricted picker access. The final ROLLBACK must remain.

Browser verification used isolated fixture data at 1440px and 390px, including form-14 → shared profile editor → save → refreshed draft → saved record → current-profile change → historical form comparison. No fixture residents or assessments remain in the live database.
