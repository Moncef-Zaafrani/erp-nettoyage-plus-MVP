# 04 — Dashboard

## Purpose
- At-a-glance overview of operations.
- Quick actions for common tasks.
- Role-scoped data.

---

## Current Implementation (Phase 1)

### Layout
- Welcome header with user name and role badge.
- Quick Navigation shortcuts (role-specific links).
- Quick Actions (functional modals, not just navigation).
- Activity Feed + Mini Calendar (side by side).
- Coming Soon features section (role-specific previews).

---

## Quick Navigation (role-scoped)

### Super Admin / Admin
- Users, Clients, Contracts, Sites

### Superviseur
- My Agents, Sites, Planning

### Agent
- My Schedule, My Missions

### Client
- My Contracts, My Sites

---

## Quick Actions ✅ Implemented
Modals that DO something (not just navigate):

| Action | Description | Storage |
|--------|-------------|---------|
| **Quick Note** | Write a note, saves locally | localStorage (backend in Phase 2) |
| **Quick Timer** | Start/pause/reset stopwatch | In-memory |
| **Report Issue** | Submit issue with priority | localStorage (backend in Phase 2) |

---

## Activity Feed ✅ Implemented

### Super Admin Only
- Real audit log feed from `/api/audit` endpoint.
- Shows recent CREATE, UPDATE, DELETE, LOGIN actions.
- Color-coded by action type.
- Time-ago formatting.

### Other Roles
- Placeholder: "Your activity feed is coming soon."

---

## Calendar Preview ✅ Implemented
- Mini calendar showing current month.
- Today's date highlighted.
- WIP badge in corner.
- Navigation arrows disabled (non-functional).
- "Full calendar coming in Phase 2" message.

---

## Coming Soon Features (role-specific)

| Role | Features Shown |
|------|----------------|
| **Super Admin / Admin** | Stock Management, Billing System, Advanced Reports |
| **Superviseur** | Quality Control, Advanced Planning, Advanced Reports |
| **Agent** | Time Tracking, Checklists, Advanced Reports |
| **Client** | Feedback System, Invoices, Advanced Reports |

Each feature card shows:
- Icon + title + description
- Phase indicator (Phase 1 or 2)
- Dashed border styling (coming soon visual)

---

## NOT Implemented (Deferred)

### KPI Cards
- ❌ Removed — no fake numbers in Phase 1.
- Will add real stats when backend data is ready.

### Alerts Section
- ❌ Deferred to Phase 2.
- Contracts expiring, unassigned interventions, missed check-ins.

### Real-time Updates
- ❌ No websocket/polling yet.
- Activity feed loads on page mount only.

---

## Acceptance Criteria ✅

- [x] Dashboard loads quickly.
- [x] Welcome header shows user name and role badge.
- [x] Quick Navigation shows role-appropriate links.
- [x] Quick Actions open functional modals.
- [x] Super Admin sees real audit logs in Activity Feed.
- [x] Other roles see "coming soon" placeholder for Activity Feed.
- [x] Mini calendar displays current month with today highlighted.
- [x] Coming Soon section shows role-specific upcoming features.
- [x] All text is translated (EN/FR/AR).
- [x] Responsive design (mobile-friendly).
