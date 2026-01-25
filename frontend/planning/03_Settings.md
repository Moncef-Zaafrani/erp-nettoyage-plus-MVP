# 03 — Settings

## Access
- All roles can access Settings (scoped to their permissions).

---

## Sections

### Appearance
- Theme: Light / Dark / System default.
- Sidebar collapsed by default: on/off.

### Language
- Language selector: French (default), English, Arabic.
- Changes apply immediately, persisted to user profile.

### Table Preferences
- Default rows per page: 10 / 25 / 50 / 100.
- Compact mode: reduces row height for denser view.
- Remember column visibility preferences per table.

### Notifications
- Email notifications: on/off per category (assignments, status changes, reminders).
- In-app notifications: on/off.
- Sound on new notification: on/off.

### Account
- Change password (current password + new password + confirm).
- Email change (requires confirmation).
- Two-factor authentication [WIP — Phase 2].

### Sessions (Super Admin / Admin only)
- View active sessions (device, location, last active).
- Revoke other sessions.

---

## Empty State Toggles
- "Show helpful tips in empty states": on/off.
- User can dismiss tips permanently from settings.

---

## Data Export (Super Admin only)
- Request full data export [WIP — Phase 2].

---

## Save Behavior
- Auto-save on change with subtle confirmation toast.
- Or explicit "Save" button per section.

---

## Acceptance Criteria
- Theme switch applies instantly.
- Language switch reloads labels without page refresh.
- Table row preference persists across sessions.
- Password change requires current password validation.
