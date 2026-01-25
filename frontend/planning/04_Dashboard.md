# 04 — Dashboard

## Purpose
- At-a-glance overview of operations.
- Quick actions for common tasks.
- Role-scoped data.

---

## Layout
- Top row: KPI cards (4-5 key metrics).
- Middle: Activity feed + Calendar preview (side by side or stacked on mobile).
- Bottom: Quick actions + Alerts.

---

## KPI Cards (role-scoped)

### Super Admin / Admin
- Total active clients.
- Interventions today (completed / scheduled).
- Agents on duty now.
- Pending issues / alerts.
- Contracts expiring soon (count).

### Superviseur
- Agents in your zone (on duty / total).
- Interventions today in your zone.
- Check-ins completed vs expected.
- Open issues in your zone.

### Agent
- My missions today (completed / remaining).
- Next mission (time + site name).
- My check-in status.

---

## Activity Feed
- Recent events: new assignments, status changes, check-ins, incidents.
- Filterable by type.
- Click item → navigate to detail page.
- Real-time updates (polling or websocket).

---

## Calendar Preview
- Mini calendar showing today + upcoming days.
- Dots or highlights on days with interventions.
- Click day → go to full Planning page filtered to that day.

---

## Quick Actions
- New Intervention.
- New Client.
- Assign Agent (opens modal).
- View All Notifications.
- Actions shown based on role permissions.

---

## Alerts Section
- Contracts expiring within 7 days.
- Unassigned interventions.
- Agents without check-in today.
- Displayed as dismissible cards or list.

---

## Acceptance Criteria
- Dashboard loads in under 2 seconds (perceived).
- KPIs refresh on page load.
- Activity feed shows last 10 events, "Load more" option.
- Quick actions respect role permissions.
