# Users Page & Tab Redesign — Step-by-Step Plan

## Step 1: Access & High-level Rules (enforced frontend + backend)

- Access allowed: Super Admin, Admin, Superviseur only.
- Blocked: Agent, Client must not see navigation links or pages.
- Enforce checks both client-side and server-side on every request (authorization middleware).
- Single Super Admin session rule: enforce in auth/session logic (note: backend change, WIP but list it here).
- Logging: every access to Users page and every user modification must be recorded in an audit log (minimal Phase 1: who/what/when).

- Acceptance criteria
  - Non-authorized roles receive 403 on UI routes and endpoints.
  - Super Admin unique-login control is documented and tested.
  - Audit log entries exist for all access and modifications. Even if the user tries accessing the page directly via URL, it should be logged.

---

## Step 2: Roles and Responsibilities

- **Super Admin**
  - Full create/read/update/archive for all users and all roles.
  - Can assign/create normal roles/custom roles (custom roles UI: show but when clicked shows the Phase 2 pop up, grayed out).
  - Can view audit logs + change any user status (force).
  - Acceptance: Super Admin can perform any action on any user in UI and logs show the action.

- **Admin**
  - Manage Supervisors, Agents, Clients (create/edit/archive) but not other Admins or Super Admin.
  - Acceptance: Admin cannot view or edit Admin/Super Admin accounts; attempts produce a clear error.

- **Superviseur** (maps to Chef d’équipe / Chef de site)
  - View only their assigned Agents. (add this feature to the backend)
  - Cannot change role, contract info, personal details.
  - Limited edits on those Agents: attendance status, site assignment, performance notes.
  - Acceptance: Superviseur list shows only assigned Agents; edit operations limited to allowed fields.

- **Agent**
  - No access to Users page (can view own profile via “My profile” elsewhere).
  - Acceptance: Agent cannot access Users page routes or see Users nav if he tried to access it directly via URL, it should be logged.

- **Client**
  - No access to Users page (client portal separate).
  - Acceptance: Client cannot access Users page or Users endpoints if he tried to access it directly via URL, it should be logged.

---

## Step 3: Field-level Permissions & UI behavior

- Super Admin: all fields + audit actions + role management.
- Admin: all fields for Supervisor/Agent/Client; cannot touch Admin/Super Admin fields.
- Superviseur: view all fields for assigned Agents; edit only:
  - Attendance status (Active / On break / Ended shift / Inactive)
  - Site assignment (assign agent to site from list)
  - Performance notes (free text short)
  
-> UI hints: disabled fields should show tooltip “You don’t have permissions to edit this field.”
-> All role changes and sensitive actions must require confirmation modals with action summary.

- Acceptance criteria
  - Attempted edits outside permissions are blocked and show clear messages if the user tries to edit the field melaciouslly or via API request log it and give eror.
  - Confirmation modal appears for Archive, Change Role, Reset Password.

---

## Step 4: Role Hierarchy, Assignment Logic & Status rules

### Role Hierarchy

- Super Admin > Admin > Superviseur > Agent
- Clients are outside hierarchy (view-only access to own resources).

### Assignment logic

- Super Admin & Admin: assign Supervisors to Agents; assign Agents to one or more sites.
- Superviseur: can only reassign agents within their zone/team (UI filter must prevent cross-zone assignment).
- Agents: always linked to at least one Supervisor and at least one Site (enforce at creation).
- Clients: linked to sites and contracts, not to personnel.

### Statuses (employee)
- Active, Inactive, Archived (soft delete).
- Employee self-status transitions (Active ↔ Inactive) allowed (e.g., start/end shift) — these are quick actions in mobile/app but reflected in Users page history.
- Only Super Admin (or Admin for non-forced cases) can Archive/Restore.
- Archived employees are permenantly inactive, if restored they will be inactive but can be activated again.
- Super Admin account itself: no status field (cannot be archived, cannot be active or inactive, his status is SUPER).

#### Statuses (client)
- Current, Former, Archived.
- Current: Client is under an active contract and can access their portal.
- Former: Client's contract has ended; No cuurent work or contract is with them but still has access to the portal to see old contracts and works, or to leave a review, and historical data is retained.
- Archived: Client is fully removed from active operations (soft delete); no access, but data is kept for records.


- Acceptance criteria : 
  - Assignment actions trigger validation: cannot assign Agent to Supervisor outside agent’s zone.
  - Status transitions are logged with timestamp and actor.

---

## Step 5: UI Structure & Components (Phase 1 screens)

### 5.1 Navigation & Entry Points

- Sidebar nav item:
  - Super Admin: “Users” → dropdown: Admins, Supervisors, Agents, Clients, Custom Roles (WIP badge for Roles manager its Phase2 features).
  - Admin: “Users” → dropdown: Supervisors, Agents, Clients.
  - Superviseur: “Your Agents”. no dropdown.

- Clicking category → filtered list. Double-click “Users” or “All” → combined list (limited to viewport permissions).

- UX: show counts per category (e.g., Agents: 178). Provide a small info icon that explains “Counts reflect currently visible users based on your role.”

---

### 5.2 List/Table View (per role)

- Common columns: Name, Email, Role(if “All”) / Zone(if its an agent or supervisor) / Supervisor(if its an agent or supervisor) / Number of assigned sites(if its an agent or supervisor), Status, Actions.
- Actions cell: contextual buttons (Edit, Archive/Restore, Quick Status (Sleep/Awake), More → details).
- Multi-select and batch actions (only for Super Admin & Admin): Activate(Restore), Deactivate(Archive), Assign Site, Assign Supervisor, Batch Add.
- Filters & search: role (if “All”), status, zone, site, supervisor, free-text (name/email/id).
- Pagination + server-side filtering. Keep page size options.

- WIP (Phase 2) UI elements (greyed & annotated)
 - Export to CSV with detailed audit history (Phase 2).
 - Role analytics chart in table header (Phase 3).
---

### 5.3 User detail page (contextual per role)

- Top summary: placeholder avatar photo (until feature will be implementedd), name, role, status badge, primary contact, zone & supervisor, assigned sites.
- Tabs (Phase 1): Overview | Assignments | Status History (logs) | Notes
  - Overview: personal details, contract reference (link to Contract module).
  - Assignments: list of sites and schedule references (show assigned schedule entries if available).
  - Status History: immutable audit trail entries (who changed what/when).
  - Notes: performance notes (Superviseur can add/edit; Admin/Super Admin can add/edit/remove). Note will have a tag of who made the note.
- Actions in header: Edit (permitted fields), Reset Password (Admin/Super Admin), Deactivate/Archive.
- If the user has multi-site assignments, show pill badges for each site.
- If the user has multi-schedule assignments, show pill badges for each schedule.
- If the user has multi-contract assignments, show pill badges for each contract.
- If the user has multi-client assignments, show pill badges for each client.

- Acceptance criteria
  - Clicking a user from list opens detail page; detail actions respect field-level permissions.

---

## Step 6: Batch Actions & Bulk UX

- Batch Add: CSV template for users (Phase 1: support Agents, Supervisors, Clients).
- Batch Assign: allow assigning selected Agents to Site or Supervisor; validation checks prevent cross-zone assignments for Superviseur.
- Batch status operations must show preflight summary and impact (e.g., “This will archive 10 agents — they will lose login access”).
- Undo option for batch actions within a short window, 15 seconds can be modified later in settings (UI-level; backend provide soft-delete/archival).

- Acceptance criteria
  - CSV import preview prior to commit; errors clearly reported row-by-row.

---

## Step 7 : Integration points with Phase 1 modules (clear mapping + WIP controls)

- Interventions / Planning: Users page must show and allow linking an Agent to interventions/planning entries (Phase 1). If planning redesign not ready, show link/button greyed with tooltip: “Planning module — Phase 1 (link active once planning redesign is deployed).”
- Contracts: show contract IDs on user page (read-only link). Full contract management is Phase 1 — but if not implemented, show WIP.
- Audit & reports: minimal audit log viewer for Super Admin (Phase 1). Advanced reports are Phase 2/3 (greyed).

---

## Step 8 : Data & Validation (frontend UX expectations; DB rework note)

- Required fields on create user: First name, Last name, Email (unique), Role, Supervisor (if Agent), At least one Site (Agent).
- Validation UI: inline validation messages; prevent submit if required fields missing.
- Email confirmation UX: show “Confirm Email” control for Admin/Super Admin; if unconfirmed show a red badge.
- Note: you’ll implement database schema changes for assignment history and audit logs in the backend (“database rework in backend”) feel free to model the database as you want.

---

## Step 9 : Audit, Logs & Security UX

- Audit trail visible to Super Admin: entries like “Admin X changed Supervisor for Agent Y from A to B — date/time.”
- When a sensitive change occurs (role change, archive, password reset), send a notification to the Super Admin (Phase 1: simple in-app bell + email optional as Phase 2).
- Password reset flow: Admin/Super Admin can trigger reset; user receives email (email sending configuration considered Phase 1).
- Session management note: Super Admin single-login enforcement is planned (backend).

---

## Step 10 : Testing & QA (concrete checklist)

- Unit tests: role-based permission checks for each UI action (list, detail, edit, archive).
- Integration tests: create Admin → create Supervisor → assign Agents → verify visibility rules.
- E2E tests (staging): simulate Superviseur view — cannot peek into other zones.
- Manual QA checklist:
  - Create user with missing fields → correct error messages.
  - Admin attempts to edit Super Admin → blocked.
  - Superviseur attempts to assign agent to site outside zone → blocked.
  - Batch CSV import → preview errors & successful rows.
  - Audit log entry appears after status change.

- Acceptance criteria
  - All tests pass in staging; documented test scenarios available.

---

## Requirements : UX polish, accessibility & localisation

- Accessibility: labels, aria attributes, keyboard navigation for table actions, contrast checks.
- Localisation: UI strings ready for FR/EN/AR.
- Dark mode / light mode works.
- Small UX touches:
  - WIP badges for Phase 2/3 features (greyed controls + tooltip + small i con animation).
  - Helpful empty-state screens (e.g., “No Agents assigned — click ‘Create New’ to add”) can be disabled in settings.
  - Bulk action confirmation summaries.