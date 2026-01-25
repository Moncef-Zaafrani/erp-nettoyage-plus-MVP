# 06 — Contracts

## Access
- Super Admin, Admin: full CRUD.
- Superviseur: read-only (contracts for their zones).
- Agent: no access.
- Client: read-only (own contracts — Phase 2 portal).

---

## List View
- Table columns: Contract ID, Client name, Type, Status, Start date, End date, Sites count, Actions.
- Type badges: Permanent (recurring), One-off (ponctuel).
- Status badges: Active, Suspended, Finished, Archived.
- Filters: status, type, client, date range.
- Sort by start date, client, status.

---

## Actions (per row)
- View → Detail page.
- Edit → Edit modal or page.
- Suspend / Resume → Confirmation modal.
- Archive → Confirmation modal.

---

## Create / Edit Contract
- Fields:
  - Client (required, searchable dropdown).
  - Type: Permanent / One-off (required).
  - Status: Active / Suspended.
  - Start date (required).
  - End date (optional for permanent, required for one-off).
  - Description / scope.
  - Linked sites (multi-select from client's sites).
  - Schedule reference (link to Planning entries for permanent contracts).
- Validation: end date must be after start date.

---

## Contract Detail Page
- Header: Contract ID, client name (link), type badge, status badge, date range.
- Tabs:
  - Overview: description, dates, notes.
  - Sites: linked sites list.
  - Interventions: scheduled and completed interventions under this contract.
  - Documents [WIP — Phase 2].
  - History: audit log.
- Actions: Edit, Suspend/Resume, Archive, Add Site, Schedule Intervention.

---

## Status Transitions
- Active ↔ Suspended (admin action).
- Active / Suspended → Finished (end date reached or manual).
- Any → Archived (soft delete).

---

## Acceptance Criteria
- Create contract linked to client and sites → appears in list.
- Suspending contract updates status, linked interventions show warning.
- Contract detail shows interventions history.
