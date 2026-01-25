# 11 — Agent Mobile Experience

## Purpose
- Lightweight, fast interface for field agents.
- Core flows: view missions, check-in, complete tasks, upload photos.

---

## Access
- Agent role only.
- Responsive web app (works on mobile browsers).
- Native app wrapper optional (Phase 2).

---

## Screens

### My Missions (Home)
- Today's missions list, ordered by time.
- Each card: time, site name, address, status badge.
- Tap card → Mission Detail.
- Pull-to-refresh.
- Empty state: "No missions today."

### Mission Detail
- Site info: name, address, contact, requirements.
- Intervention info: time, duration, instructions.
- Status: Not Started / In Progress / Completed.
- Actions based on status (see below).

### Check-in Flow
- "Start Mission" button (visible when Not Started).
- Tap → request GPS location.
- Confirm location on mini-map.
- Optional: take arrival photo.
- Submit → status changes to In Progress.
- Timestamp recorded.

### During Mission
- Timer showing elapsed time.
- "Add Photo" button → camera capture or gallery.
- "Report Issue" button → opens issue form (description, photo, severity).
- Photos upload in background (retry on failure).

### Complete Mission
- "Finish Mission" button.
- Request GPS (departure location).
- Optional: take completion photo.
- Submit → status changes to Completed.
- Success confirmation.

### My Profile
- View own info (name, email, zone, supervisor).
- Change password.
- Notification preferences.

### Notifications
- Same as web but mobile-optimized list.

---

## Offline Behavior (Phase 1 — Basic)
- If offline during check-in/complete, queue action locally.
- Show "Pending sync" indicator.
- Auto-retry when connection restored.
- Photos queued for upload.

---

## GPS & Permissions
- Request location permission on first check-in.
- If denied, show clear instructions to enable.
- GPS accuracy indicator (if low accuracy, warn user).

---

## Acceptance Criteria
- Agent sees today's missions on login.
- Check-in records GPS and timestamp.
- Photo uploads successfully (or queues if offline).
- Completing mission updates status visible to supervisors.
