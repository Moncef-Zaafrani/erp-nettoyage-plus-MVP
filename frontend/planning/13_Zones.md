# 13 — Zones Management

## Purpose
- Zones are geographic/logical groupings of sites.
- Used to scope Superviseur visibility and agent assignments.
- Based on company operations (Zone 1-6 per COMPANY_OPERATIONS.md).

---

## Access
- Super Admin, Admin: full CRUD.
- Superviseur: view only (their assigned zones).
- Agent, Client: no access.

---

## List View
- Table: Zone name, Superviseur(s), Sites count, Agents count, Actions.
- Simple list (likely 6 zones, no pagination needed).

---

## Create / Edit Zone
- Fields:
  - Name (required, unique).
  - Description.
  - Assigned Superviseur(s) (multi-select).
- Validation: at least one Superviseur recommended (warning if none).

---

## Zone Detail Page
- Header: name, description.
- Tabs:
  - Superviseurs: assigned supervisors.
  - Sites: sites in this zone.
  - Agents: agents assigned to sites in this zone.
- Actions: Edit, Assign Superviseur.

---

## Behavior
- Deleting a zone: not allowed if sites exist (must reassign first).
- Changing site zone: triggers re-scoping of Superviseur visibility.

---

## Acceptance Criteria
- Create zone → appears in list.
- Assign Superviseur → Superviseur now sees zone's sites and agents.
- Cannot delete zone with active sites.
