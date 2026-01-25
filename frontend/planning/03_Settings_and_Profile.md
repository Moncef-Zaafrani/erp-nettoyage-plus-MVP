# 03 — Settings & My Profile

## Overview
Combined settings and profile management for all users. Features are scoped by role with appropriate permissions.

---

# Part 1: My Profile

## Access
- All authenticated users can view and edit their own profile.

---

## Profile Photo
- Upload profile photo (JPEG, PNG, max 5MB).
- Crop/resize tool before upload.
- Default avatar with initials if no photo.
- Remove photo option.
- Photo displayed in: TopBar, Sidebar (collapsed), user cards, reports.

## Personal Information

### Basic Info
- Full name (first + last).
- Display name (how name appears in app).
- Phone number (primary + secondary optional).
- Personal email (for password recovery, separate from work email).
- Date of birth.
- National ID / Passport number (Agents/Supervisors).
- Address (street, city, region).

### Emergency Contact
- Contact name.
- Relationship (spouse, parent, sibling, friend, other).
- Phone number.
- Secondary phone (optional).
- Notes (e.g., "Call after 6pm").

### Employment Details (Read-only for Agents)
- Employee ID.
- Role (Admin, Supervisor, Agent, Comptable, Client).
- Department / Zone assignment.
- Hire date.
- Contract type (CDI, CDD, Freelance).
- Direct supervisor.

---

## Skills & Qualifications (Agents / Supervisors)

### Certifications
- Add/view certifications (e.g., Safety Training, Chemical Handling, First Aid).
- Certificate name.
- Issuing authority.
- Issue date.
- Expiry date (with reminder alerts).
- Upload certificate document (PDF/image).
- Status: Valid / Expiring Soon / Expired.

### Languages Spoken
- Add languages with proficiency level (Basic, Intermediate, Fluent, Native).
- Useful for client site assignments (e.g., French-speaking clients).

### Equipment Competencies
- Mono-brosse (floor scrubber).
- High-pressure washer.
- Vacuum (industrial).
- Window cleaning equipment.
- Height work equipment (ladders, scaffolding).
- Vehicle license (for mobile teams).

### Special Skills
- Facade cleaning.
- Post-construction cleaning.
- Disinfection protocols.
- VIP/Executive area standards.

---

## Work Preferences (Agents / Supervisors)

### Availability
- Preferred working hours (e.g., 07:00–15:00).
- Days available (checkbox: Mon–Sun).
- Unavailable dates (vacations, personal days) — syncs with Absences module.
- Maximum travel distance from home (km).
- Preferred zones (Zone 1, Zone 2, etc.).

### Assignment Preferences
- Preferred site types: Banks, Offices, Government, Schools, Medical.
- Sites to avoid (with reason, visible to supervisors only).
- Prefer recurring assignments vs. varied assignments.

---

## Profile Completion Indicator
- Progress bar showing profile completeness (%).
- Checklist of missing items:
  - [ ] Profile photo
  - [ ] Phone number
  - [ ] Emergency contact
  - [ ] Certifications (for Agents)
- Nudge banner: "Complete your profile to receive better assignments."

---

# Part 2: Settings

## Access
- All roles can access Settings (scoped to their permissions).

---

## Themes & Appearance

### Theme Selection
Users can choose from curated themes (not just light/dark):

| Theme Name | Description | Best For |
|------------|-------------|----------|
| **System Default** | Follows OS preference | General use |
| **Light Classic** | Clean white background, blue accents | Bright environments |
| **Dark Mode** | Dark background, reduced eye strain | Night/low-light |
| **Ocean Blue** | Deep blue tones, professional | Office settings |
| **Forest Green** | Green accents, calming | Extended use |
| **Sunset Orange** | Warm orange tones | Creative preference |
| **High Contrast** | Maximum contrast for accessibility | Visual impairments |
| **Minimal Gray** | Neutral grays, distraction-free | Focus mode |
| **Nettoyage Plus Brand** | Company colors (blue/green) | Brand consistency |

### Appearance Options
- Sidebar: Expanded / Collapsed by default.
- Sidebar position: Left / Right.
- Animation: Enable/disable interface animations.
- Font size: Small / Medium / Large.
- Compact mode: Reduces spacing throughout app.

---

## Notifications

### In-App Notifications
- Enable/disable in-app notifications.
- Sound on new notification: on/off.
- Desktop notifications (browser): on/off.
- Badge count on sidebar icon.

### Email Notifications
- Daily digest vs. instant notifications.
- Categories (toggle each):
  - [ ] New mission assignments.
  - [ ] Mission changes/cancellations.
  - [ ] Schedule reminders (day before).
  - [ ] Quality control results.
  - [ ] Absence request updates.
  - [ ] System announcements.
  - [ ] Weekly performance summary.

### Push Notifications (Mobile)
- Enable/disable push.
- Quiet hours: Set time range to mute (e.g., 22:00–07:00).
- Categories same as email.

### Notification Preferences by Role

| Category | Agent | Supervisor | Admin | Client |
|----------|-------|------------|-------|--------|
| Mission assignments | ✓ | ✓ | ✓ | — |
| Schedule changes | ✓ | ✓ | ✓ | ✓ |
| Quality reports | — | ✓ | ✓ | ✓ |
| Absence requests | — | ✓ | ✓ | — |
| Invoice/billing | — | — | ✓ | ✓ |
| System alerts | — | ✓ | ✓ | — |

---

## Table & Data Preferences

### Table Display
- Default rows per page: 10 / 25 / 50 / 100.
- Compact row height: on/off.
- Show row numbers: on/off.
- Sticky header: on/off.
- Remember column visibility per table.
- Remember sort preferences per table.

### Calendar Preferences
- Default view: Day / Week / Month.
- Week starts on: Sunday / Monday.
- Show weekends: on/off.
- Time format: 12h / 24h.
- Show completed interventions: on/off.

### Map Preferences (for Supervisors/Admins)
- Default map view: Satellite / Street / Hybrid.
- Show agent locations: on/off (requires GPS consent).
- Show traffic layer: on/off.
- Cluster nearby sites: on/off.

---

## Account & Security

### Password
- Change password (current + new + confirm).
- Password requirements displayed.
- Last password change date.
- Force password change: Admin can require on next login.

### Two-Factor Authentication [Phase 2]
- Enable 2FA via authenticator app.
- Backup codes.
- SMS fallback (optional).

### Sessions
- View active sessions:
  - Device type (Desktop, Mobile, Tablet).
  - Browser/app.
  - IP address.
  - Location (city, country).
  - Last active time.
- Current session highlighted.
- "Sign out other sessions" button.
- "Sign out all sessions" (including current).

### Login History (Admin visible)
- Last 10 login attempts.
- Success/failure status.
- Timestamp and location.

---

## GPS & Location (Agents Only)

### GPS Consent
- Enable GPS tracking during shift: on/off.
- Explanation of how GPS is used (transparency).
- GPS only active during clocked-in hours.

### Location Accuracy
- High accuracy (uses more battery).
- Balanced (recommended).
- Low accuracy (battery saver).

### Privacy Notice
- "Your location is only tracked during active shifts."
- "Location data is used for check-in verification and site assignment."
- Link to full privacy policy.

---

## Mission & Photo Settings (Agents Only)

### Photo Upload
- Default camera: Front / Back.
- Photo quality: Low / Medium / High / Original.
- Auto-compress photos before upload: on/off.
- Include timestamp overlay on photos: on/off.
- Include location overlay on photos: on/off.

### Offline Mode
- Enable offline mode: on/off.
- Auto-sync when connection restored: on/off.
- Max offline storage: 50MB / 100MB / 500MB.
- Clear offline cache button.

### Mission Display
- Show mission notes first: on/off.
- Show checklist items expanded: on/off.
- Default sort: By time / By site / By priority.

---

## Shift & Clock Preferences (Agents / Supervisors)

### Shift Reminders
- Reminder before shift start: 30min / 1hr / 2hr / None.
- Reminder for missed clock-in: After 15min / 30min / None.
- End-of-shift reminder: 15min before / 30min before / None.

### Auto Clock-Out
- Auto clock-out after X hours if forgotten (default: 10 hours).
- Notify supervisor on auto clock-out: on/off.

### Break Preferences
- Default break duration: 30min / 1hr / Custom.
- Remind to take break after X hours: 4hr / 5hr / None.

---

## Supervisor Settings (Supervisors Only)

### Team Management
- Default view: List / Cards / Map.
- Show agent photos in lists: on/off.
- Highlight agents without assignments: on/off.

### Quality Control
- Default checklist view: Compact / Detailed.
- Auto-assign follow-up on failed items: on/off.
- Photo required for failed items: on/off.

### Reporting
- Weekly report auto-generate: on/off.
- Include which zones: Select zones.
- Report format: PDF / Excel.
- Auto-send to: Email addresses.

---

## Admin Settings (Admin Only)

### System Preferences
- Default user role for new accounts: Agent.
- Require profile photo: on/off.
- Require emergency contact: on/off.
- Password expiry: Never / 30 days / 60 days / 90 days.
- Session timeout: 30min / 1hr / 4hr / 8hr / Never.

### Data & Privacy
- Data retention period: 1 year / 2 years / 5 years / Forever.
- Anonymize old agent data: on/off.
- GDPR compliance mode: on/off.

### Integrations [Phase 3]
- Bankily payment integration: Configure.
- Email provider (Resend): Configure.
- SMS provider: Configure.
- Calendar sync (Google, Outlook): Configure.

---

## Data Export

### Personal Data (All Users)
- Download my data (JSON/CSV).
- Includes: Profile, preferences, activity history.
- Processing time: Up to 24 hours.

### Company Data (Admin Only)
- Full database export [Phase 2].
- Export by module: Clients, Sites, Interventions, Personnel.
- Schedule automated backups.

---

## Danger Zone (Account)

### Deactivate Account
- Temporarily deactivate (can be reactivated by Admin).
- Reason selection: Personal, Medical, Other.

### Delete Account [Admin Action Required]
- Request account deletion.
- Admin reviews and processes.
- Data retention per company policy.

---

# Part 3: Help & Support

## In-App Help
- "Show helpful tips in empty states": on/off.
- "Show feature tutorials": on/off (for new features).
- Reset all "Don't show again" dialogs.

## Support
- Contact support button (opens email/form).
- Report a bug.
- Request a feature.
- View FAQ.

## About
- App version.
- Last updated date.
- Terms of service link.
- Privacy policy link.
- Licenses.

---

# Save Behavior

- Auto-save on toggle/selection with subtle toast confirmation.
- Text fields: Save button or Enter key.
- Destructive actions: Require confirmation dialog.
- Changes sync across devices immediately.

---

# UI/UX Notes

## Layout
- Two-column layout on desktop: Navigation (left), Content (right).
- Mobile: Full-width with section tabs.
- Sticky section navigation.

## Profile Page
- Hero section with large profile photo.
- Edit mode toggle (view → edit).
- Inline editing for quick updates.
- Clear visual separation between sections.

## Settings Page
- Grouped into collapsible sections.
- Search/filter settings by keyword.
- "Reset to defaults" per section.
- Clear indication of role-specific settings.

---

# Acceptance Criteria

## Profile
- [ ] Profile photo uploads and displays correctly in all locations.
- [ ] Emergency contact saves and displays to supervisors/admins.
- [ ] Certifications with expiry dates trigger alerts.
- [ ] Profile completeness percentage calculates accurately.
- [ ] Work preferences save and affect assignment suggestions.

## Settings
- [ ] Theme changes apply instantly without page refresh.
- [ ] Notification preferences persist and affect actual notifications.
- [ ] Table preferences persist across sessions and page reloads.
- [ ] GPS consent toggle affects actual tracking behavior.
- [ ] Session management allows signing out other devices.
- [ ] Password change requires current password validation.
- [ ] Settings are scoped correctly per role.

## General
- [ ] All changes sync across devices in real-time.
- [ ] Mobile-responsive layout for all sections.
- [ ] Proper loading states and error handling.
- [ ] Confirmation toasts for saved changes.
