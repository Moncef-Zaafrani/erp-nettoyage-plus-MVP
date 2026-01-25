# 14 — Audit Logs

## Purpose
- Track all sensitive actions for security and compliance.
- Visible to Super Admin (and optionally Admin for their scope).

---

## Access
- Super Admin: full access, all logs.
- Admin: view logs for actions they can perform (optional Phase 1, required Phase 2).
- Others: no access.

---

## Log Entry Structure
- Timestamp.
- Actor (user who performed action).
- Action type (create, update, delete, login, logout, access attempt).
- Target (entity type + ID, e.g., "User #42").
- Details (what changed, old → new values).
- IP address (optional).

---

## List View
- Table: Timestamp, Actor, Action, Target, Details (truncated).
- Filters: date range, actor, action type, target type.
- Search: actor name, target ID.
- Sort by timestamp (default: newest first).
- Pagination.

---

## Detail View
- Click row → expanded view or modal.
- Full details JSON or formatted diff.

---

## Logged Actions (Phase 1)
- User login / logout / failed login.
- User created / updated / archived / restored.
- Role changed.
- Password reset triggered.
- Client / Contract / Site / Intervention created / updated / archived.
- Agent assigned / unassigned.
- Access denied attempts (403 on protected routes).

---

## Retention
- Logs kept indefinitely (or configurable retention policy Phase 2).
- No delete action available (immutable).

---

## Acceptance Criteria
- Every user modification creates an audit log entry.
- Super Admin can filter logs by date and actor.
- Failed access attempts are logged with target route.
