# Resident forms

Forms are managed from Elderly List and each resident's Profile. The standalone Forms Management page was removed; old bookmarks redirect to Elderly List.

1. In Elderly List, open a resident's actions menu and choose **Create Form**.
2. Select one of the 24 form cards. The drawer locks the resident to that record and fills the current account's username as the default author.
3. Save the assessment. **View Forms** opens the same resident's Profile → Forms tab.
4. Forms can also be created in Profile → Forms. Search, filter by type/status, and choose 5/10/15/20 records per page. Each assessment remains a separate historical record.
5. View opens a read-only form; Edit and Delete are shown only for the corresponding Elderly List permissions. Changing an assessment's resident/type is prevented in the database.

## Persistence and permissions

`elderly_form_records` references `public.elderly.id`. Common fields are stored in typed columns; form-specific answers are stored in JSONB with schema version 1. The client loads answer payloads only when opening a record. Optimistic update/delete checks prevent silently overwriting changes by another staff member.

The SQL migrations in `supabase/migrations` were applied to the connected Saferin project. New environments must have the existing `elderly`, `app_users`, `page_permissions` tables before applying them. RLS uses the active account's role and Elderly List read/write/delete configuration; Admin has full access. Existing resident visibility policies also apply.

Completed form records protect their parent resident from deletion through an ON DELETE RESTRICT foreign key. This prevents silently discarding assessment history.

## Resident demographics

Creating any of the 24 form types fetches the selected resident profile by `elderly.id`, including existing contacts and health information. Matching age, gender, birth/admission date, resident number and room/bed fields are filled automatically. Existing free-text history fields also receive known conditions; structured clinical checklists are not inferred. Room and bed are stored separately and combined only for combined form fields. Zone is not substituted for floor.

The shared Add/Edit Resident drawer stores basic, admission, contact, health and personal-background information once. Enter unknown details through Elderly List → Add/Edit or Profile → Edit Profile; subsequent new forms use them. Date of birth drives calculated age; age remains optional and editable when birth date is unknown. No demographic or admission values are guessed. Relatives' ages and genders are independent of the resident.

Each new assessment saves `residentSnapshot` in its JSON payload alongside the prefilled form fields. Viewing/editing an existing assessment preserves that snapshot and its original answers; it never replaces historical age or bed with the resident's current data. Older assessments without a snapshot are retained unchanged.

The personal-information form (form-14) is generated from the shared profile, including contacts, health information, personal background and relatives. “修改院友資料” opens the same editor. A newly created draft refreshes after saving the profile while keeping its date, author and notes. Existing records show differences without overwriting history; editing a record offers an explicit confirmation before importing current profile data. `profileSnapshot` retains the complete shared profile used for that record. See `resident-profile.md` for database mappings and verification.

## Verification

- `npm run typecheck`
- `npm run build`
- `node tests/resident-forms.cjs`: all 24 types, demographic prefill/snapshot persistence, missing data, relatives' independent data, historical/legacy preservation, lookup failures, save/reload, resident isolation, view/edit/cancel, filtering/pagination, stale edits, failed saves and permission revocation.
- `tests/resident-forms-rls.sql`: database integration test using a transaction and rollback. Requires an existing active Admin and Caregiver. It verifies CRUD, all 24 type payloads, permission changes, inactive/anonymous denial, and reassignment protection. Do not remove the final ROLLBACK.

Browser workflow verification used isolated fixture data at 1440px and 390px: select form → scroll drawer → save → profile list → view/edit/delete, plus readonly/write-only button checks. No fixture assessments were retained in the live database.
