# 10 — Notifications

## Access
- All roles receive notifications scoped to their permissions.

---

## Notification Bell (Top Bar)
- Icon with unread count badge.
- Click → dropdown panel showing recent notifications.
- Each item: icon, title, short message, timestamp, unread indicator.
- Click item → navigate to related page (intervention, user, etc.).
- "Mark all as read" action.
- "View all" link → full Notifications page.

---

## Notifications Page
- Full list of notifications, paginated.
- Filters: read/unread, category (assignments, status changes, alerts, system).
- Bulk actions: Mark as read, Delete.
- Each notification shows full message and link to source.

---

## Notification Categories

### Assignments
- New intervention assigned.
- Removed from intervention.
- Agent assigned to you (for Superviseur).

### Status Changes
- Intervention status changed (scheduled, in progress, completed, cancelled).
- User status changed (for Admins).
- Contract status changed.

### Alerts
- Intervention starting soon (configurable reminder).
- Agent missing check-in.
- Contract expiring soon.

### System
- Password reset requested.
- Account changes (email, role).
- Session forced logout.

---

## Delivery Channels
- In-app: always (real-time via polling or websocket).
- Email: optional per category (configured in Settings).
- Push (mobile): Phase 2.

---

## Real-time Behavior
- New notification appears without page refresh.
- Bell badge updates instantly.
- Optional sound (configurable).

---

## Acceptance Criteria
- Assigning agent triggers notification visible in their bell.
- Marking as read clears unread badge.
- Email sent if user has email notifications enabled for that category.
- Notifications page loads with filters working.
