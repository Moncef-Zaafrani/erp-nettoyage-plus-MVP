# 07 — Sites

## Access
- Super Admin, Admin: full CRUD.
- Superviseur: read-only + limited edits (assignment notes).
- Agent: view assigned sites only.
- Client: view own sites (Phase 2 portal).

---

## List View
- Table columns: Site name, Client, Zone, Address (short), Agents count, Status, Actions.
- Status: Active, Inactive, Archived.
- Filters: zone, client, status, search.
- Sort by name, zone, client.

---

## Actions (per row)
- View → Detail page.
- Edit.
- Archive.

---

## Create / Edit Site
- Fields:
  - Name (required).
  - Client (required, searchable dropdown).
  - Zone (required, dropdown based on company zones).
  - Address (required).
  - Working hours (start time, end time).
  - Size category: Small / Medium / Large.
  - Specific requirements (free text).
  - Contact person on-site (name, phone).
- Validation: site name unique per client.

---

## Site Detail Page
- Header: name, client (link), zone badge, address, status.
- Tabs:
  - Overview: hours, size, requirements, contact.
  - Assigned Agents: list of agents currently assigned.
  - Contracts: contracts covering this site.
  - Interventions: upcoming and past interventions at this site.
  - Check-lists [WIP — Phase 2].
  - History: audit log.
- Actions: Edit, Assign Agent, Schedule Intervention, Archive.

---

## Zone Assignment
- Sites belong to exactly one zone.
- Zone determines which Superviseur can see the site.
- Zone dropdown populated from system zones (see COMPANY_OPERATIONS zones).

---

## Acceptance Criteria
- Create site linked to client → appears in list and client detail.
- Superviseur sees only sites in their zone(s).
- Site detail shows assigned agents and interventions.
