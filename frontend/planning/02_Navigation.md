# 02 — Navigation

## Structure
- Left sidebar (collapsible) + top bar.
- Sidebar: main navigation items.
- Top bar: search, notifications bell, user avatar dropdown.

---

## Sidebar — Role-based Items

### Super Admin
- Dashboard
- Users (dropdown: Admins, Supervisors, Agents, Clients, Roles [WIP badge])
- Clients
- Contracts
- Sites
- Planning / Interventions
- Personnel
- Notifications
- Settings
- Audit Logs

### Admin
- Dashboard
- Users (dropdown: Supervisors, Agents, Clients)
- Clients
- Contracts
- Sites
- Planning / Interventions
- Personnel
- Notifications
- Settings

### Superviseur
- Dashboard (zone-scoped)
- Your Agents
- Sites (assigned zones only)
- Planning (assigned zones only)
- Notifications
- Settings

### Agent
- My Missions (today's tasks)
- My Profile
- Notifications
- Settings (limited)

### Client
- My Contracts
- My Sites
- Invoices [WIP]
- Notifications
- Settings (limited)

---

## Top Bar
- Global search (searches across clients, sites, users, interventions).
- Notification bell with unread count badge.
- User avatar → dropdown: My Profile, Settings, Logout.

---

## Sidebar Behavior
- Collapse to icons only (persisted preference).
- Active item highlighted.
- Counts/badges on items when relevant (e.g., pending notifications).
- Smooth expand/collapse animation.

---

## Mobile / Tablet
- Sidebar becomes hamburger menu (slide-in drawer).
- Top bar remains visible.
- Bottom navigation for Agent role (quick access: Missions, Profile, Notifications).

---

## Acceptance Criteria
- Each role sees only permitted nav items.
- Attempting direct URL access to forbidden page → redirect to Dashboard + toast error.
- Search returns results scoped to user permissions.
- Notification bell shows real-time unread count.
