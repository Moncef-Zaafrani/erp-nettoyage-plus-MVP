# 05 — Clients

## Access
- Super Admin, Admin: full CRUD.
- Superviseur: read-only (clients in their zones).
- Agent, Client: no access.

---

## List View
- Table columns: Name, Type (company/individual), Status, Sites count, Contracts count, Actions.
- Status badges: Current, Former, Archived.
- Filters: status, type, search (name, email, phone).
- Sort by name, creation date, status.
- Pagination with configurable rows.

---

## Actions (per row)
- View → Detail page.
- Edit → Edit modal or page.
- Archive → Confirmation modal.

---

## Create / Edit Client
- Modal or dedicated page.
- Fields:
  - Name (required).
  - Type: Company / Individual.
  - Contact person name.
  - Email (required, unique).
  - Phone.
  - Address.
  - Notes.
- On save: success toast, return to list.

---

## Client Detail Page
- Header: name, type badge, status badge, primary contact.
- Tabs:
  - Overview: contact info, address, notes.
  - Sites: list of linked sites (click to view site).
  - Contracts: list of contracts (click to view contract).
  - History: audit log of changes.
- Actions in header: Edit, Archive/Restore, Create Site, Create Contract.

---

## Status Transitions
- Current → Former (contract ended).
- Current/Former → Archived (soft delete).
- Archived → Former (restore).
- Status change requires confirmation modal.

---

## Acceptance Criteria
- Create client with required fields → appears in list.
- Archive client → status changes, removed from active filters.
- Client detail shows linked sites and contracts.
- Superviseur sees read-only view, no edit/archive buttons.
