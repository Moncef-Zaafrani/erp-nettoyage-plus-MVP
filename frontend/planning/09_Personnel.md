# 09 — Personnel

## Access
- Super Admin, Admin: full access.
- Superviseur: view/edit assigned agents only.
- Agent: own profile only (via My Profile, not this page).
- Client: no access.

---

## List View
- Table: Name, Role, Zone, Supervisor, Status, Current Site, Actions.
- Status badges: Active, On Break, Inactive, Archived.
- Filters: role (Agent/Supervisor), zone, supervisor, status, search.
- Sort by name, zone, status.

---

## Actions (per row)
- View → Detail page.
- Edit.
- Quick status toggle (Active ↔ Inactive).
- Archive.

---

## Create / Edit Employee
- Fields:
  - First name, Last name (required).
  - Email (required, unique).
  - Phone.
  - Role: Agent / Superviseur (Admins created via Users page).
  - Zone (required for Agent/Superviseur).
  - Supervisor (required for Agent, dropdown filtered by zone).
  - Assigned sites (multi-select for Agent).
  - Contract type: CDI / CDD / Interim.
  - Start date.
  - Notes.

---

## Employee Detail Page
- Header: name, role badge, zone, status badge, supervisor (link).
- Tabs:
  - Overview: contact info, contract details, start date.
  - Assignments: current sites, schedule entries.
  - Absences: absence records (see Absences sub-section).
  - Check-ins: recent check-in/out records with timestamps.
  - Performance notes (editable by Supervisor+).
  - History: audit log.
- Actions: Edit, Record Absence, Change Status, Archive.

---

## Absences Sub-section
- List of absences: date range, type (sick, vacation, other), status (pending, approved, rejected).
- Create absence: date range, type, reason/notes.
- Approval flow: Superviseur submits → Admin approves.
- Calendar view option showing absences overlaid.

---

## Check-in Records
- Table: Date, Check-in time, Check-out time, Site, GPS coords, Duration.
- Link to intervention if applicable.
- Flag anomalies: late check-in, missing check-out.

---

## Acceptance Criteria
- Create agent with supervisor and site → appears in list.
- Record absence → shows in employee detail and calendar.
- Superviseur can only see/edit agents in their zone.
- Check-in records display correctly with timestamps.
