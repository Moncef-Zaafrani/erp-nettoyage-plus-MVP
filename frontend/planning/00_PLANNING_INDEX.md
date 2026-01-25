# Frontend Planning Index

## Design Philosophy
- Efficient, clean, modern — inspired by Railway, Vercel, Supabase.
- Minimal visual noise. Color-coded elements serve a purpose (status, priority, alerts).
- Fast navigation. Workers use this 90% of the time — speed matters.
- Subtle animations, no flashy distractions.
- Dark/light mode support.
- english/Frensh/Arabic basic languages is a must, other languages will be added in firther phases.

## Phase 1 — MVP Pages

| # | File | Module |
|---|------|--------|
| 01 | 01_Auth.md | Login, Register, Password Reset, Session |
| 02 | 02_Navigation.md | Sidebar, Top bar, Role-based menus |
| 03 | 03_Settings.md | User preferences, Theme, Language, Table options |
| 04 | 04_Dashboard.md | KPIs, Quick actions, Activity feed |
| 05 | 05_Clients.md | Client list, Detail, Create/Edit |
| 06 | 06_Contracts.md | Contract list, Detail, Link to Sites |
| 07 | 07_Sites.md | Site list, Detail, Requirements, Hours |
| 08 | 08_Interventions.md | Calendar, Recurring/Single, Assign agents |
| 09 | 09_Personnel.md | Employees, Absences, Check-in records |
| 10 | 10_Notifications.md | Bell icon, Notification center, Preferences |
| 11 | (see ../PlanningUsers.md) | Users management (already detailed) |

## Phase 2/3 — Future (greyed in UI)
- Quality Control (check-lists, reports)
- Stock & Materials
- Billing & Payments
- Advanced Reports
- Client Portal
- Prevention Plans

## Conventions
- WIP features: show greyed button + tooltip "Coming in Phase X".
- Empty states: helpful message + primary action button.
- Confirmation modals for destructive actions.
- Audit logging for sensitive operations.
