# 08 — Interventions & Planning

## Access
- Super Admin, Admin: full CRUD, all interventions.
- Superviseur: CRUD for their zones, view others read-only.
- Agent: view assigned interventions only.
- Client: view interventions at their sites (Phase 2).

---

## Views

### Calendar View (default)
- Month / Week / Day toggle.
- Interventions shown as blocks on calendar.
- Color-coded by status: Scheduled, In Progress, Completed, Cancelled.
- Click block → quick preview popover → link to detail.
- Drag-and-drop to reschedule (Admin/Super Admin only).

### List View
- Table: Date, Time, Site, Type, Assigned agents, Status, Actions.
- Filters: date range, site, zone, agent, status, type.
- Bulk actions: Assign agent, Cancel, Reschedule.

---

## Intervention Types
- Recurring (from permanent contract): auto-generated based on schedule pattern.
- One-off (single): manually created, linked to contract or standalone.

---

## Create Intervention
- Fields:
  - Type: Recurring / One-off.
  - Site (required).
  - Contract (optional for one-off, required for recurring).
  - Date and time (required).
  - Duration (estimated).
  - Recurrence pattern (for recurring): daily, weekly, custom days.
  - Assigned agents (multi-select, filtered by zone).
  - Notes / instructions.
- Validation: at least one agent if status is Scheduled.

---

## Intervention Detail Page
- Header: date/time, site (link), status badge, type badge.
- Info: contract link, duration, assigned agents (with check-in status).
- Tabs:
  - Overview: instructions, notes.
  - Agents: assigned agents, their check-in times, photos uploaded.
  - Check-list [WIP — Phase 2].
  - History: status changes, edits.
- Actions: Edit, Reassign Agents, Cancel, Mark Complete (if not auto).

---

## Status Flow
- Scheduled → In Progress (agent checks in).
- In Progress → Completed (agent finishes or admin marks).
- Scheduled / In Progress → Cancelled (with reason).
- Completed interventions are read-only.

---

## Notifications Triggered
- Agent assigned → notification to agent.
- Intervention rescheduled → notification to assigned agents.
- Intervention cancelled → notification to assigned agents + supervisor.

---

## Acceptance Criteria
- Create recurring intervention → appears on calendar for each occurrence.
- Assign agent → agent sees it in My Missions.
- Reschedule via drag-drop updates date and notifies agents.
- Filter by zone shows only zone's interventions.
