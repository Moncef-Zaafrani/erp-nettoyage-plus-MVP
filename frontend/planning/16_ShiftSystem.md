# 16 — Shift & Time Tracking System

## Overview
Comprehensive shift tracking for employees (Agents, Supervisors, Admins). Tracks work sessions with idle detection, provides real-time timers, and generates accurate work hour reports.

---

## Who Uses Shifts

| Role | Shift Required | Notes |
|------|----------------|-------|
| **SUPER_ADMIN** | ❌ No | System oversight, no shift tracking |
| **ADMIN** | ✅ Yes | Office staff, tracked for payroll |
| **SUPERVISOR** | ✅ Yes | Field supervisors, tracked |
| **AGENT** | ✅ Yes | Primary users, full tracking |
| **CLIENT** | ❌ No | External users, no shifts |

---

## Core Features

### 1. Clock In / Clock Out
- **Start Shift**: Click button in TopBar → records timestamp + optional GPS
- **End Shift**: Click button → records end time, calculates hours worked
- **Visual Indicator**: Green pulsing dot when on shift, red warning when off

### 2. Live Shift Timer
- Shows elapsed time since clock-in (HH:MM:SS format)
- Visible in TopBar at all times when on shift
- Persists across page refreshes (uses clock-in timestamp)
- Updates every second via `setInterval`

### 3. Daily Summary
- First clock-in time of the day
- Last clock-out time of the day
- Total hours worked today
- Number of sessions (if multiple clock-in/out)

### 4. Idle Detection (Anti-Gaming) ✅
Prevents users from clocking in and walking away.

#### Detection Methods
- **Mouse/Keyboard Activity**: Track last activity timestamp
- **Page Visibility**: Detect when tab is hidden/minimized
- **Focus Detection**: Detect when window loses focus

#### Idle Thresholds
| State | Duration | Action |
|-------|----------|--------|
| Active | 0-5 min | Normal operation |
| Warning | 5-10 min | Show "Still there?" modal |
| Idle | 10+ min | Auto-pause shift, log idle period |
| Extended | 30+ min | Auto clock-out, notify supervisor |

#### Idle Handling
1. After 5 min idle → Show modal: "Are you still working?"
   - "Yes, I'm here" → Reset timer
   - "Take a break" → Pause shift
   - No response in 5 min → Auto-pause
2. Paused shifts don't count toward worked hours
3. Activity resumes → Auto-resume shift with gap logged

---

## Data Model

### Attendance Entity (Existing)
```typescript
{
  id: UUID
  userId: UUID
  clockIn: Timestamp       // Start time
  clockOut: Timestamp      // End time (null if active)
  hoursWorked: Decimal     // Calculated on clock-out
  notes: String
  clockInLocation: Point   // GPS coordinates
  clockOutLocation: Point
  createdAt: Timestamp
}
```

### New: Idle Periods (Phase 2)
```typescript
{
  id: UUID
  attendanceId: UUID
  idleStart: Timestamp
  idleEnd: Timestamp
  idleDuration: Integer    // Minutes
  reason: Enum             // 'auto_detected' | 'user_break' | 'system'
}
```

---

## Security & Anti-Exploit Measures

### 1. Server-Side Validation
- Clock-in/out timestamps set by server, not client
- Cannot clock in if already on shift
- Cannot clock out if not on shift
- Minimum shift duration: 1 minute (prevent spam)

### 2. Session Binding
- Shift tied to user's JWT session
- Cannot manipulate via API without valid auth
- Audit log records all clock events

### 3. Rate Limiting
- Max 10 clock-in attempts per hour
- Max 20 status checks per minute
- Prevents API abuse

### 4. Location Verification (Optional)
- Record GPS on clock-in/out
- Flag suspicious locations (home when should be at site)
- Admin can review location history

### 5. Device Fingerprinting (Phase 2)
- Track device ID on clock events
- Alert if same user clocks in from multiple devices
- Prevent "buddy punching"

---

## UI Components

### TopBar Shift Indicator
```
┌────────────────────────────────────────────────┐
│  🟢 On Shift  │  02:34:15  │  [End Shift]      │
└────────────────────────────────────────────────┘
```
- Green dot: Currently on shift
- Timer: Live elapsed time
- Button: End shift action

### Off-Shift Warning
```
┌────────────────────────────────────────────────┐
│  ⚠️ Not on Shift  │  [Start Shift]  (pulsing) │
└────────────────────────────────────────────────┘
```
- Red/orange warning
- Prominent start button
- Pulsing animation to draw attention

### Idle Warning Modal
```
┌─────────────────────────────────────────┐
│         Are you still working?          │
│                                         │
│  You've been idle for 5 minutes.        │
│  Your shift will pause automatically    │
│  if you don't respond.                  │
│                                         │
│  [I'm Here]  [Take a Break]             │
│                                         │
│  ⏱️ Auto-pause in: 4:32                 │
└─────────────────────────────────────────┘
```

### Daily Summary Card (Dashboard)
```
┌─────────────────────────────────────────┐
│  📊 Today's Work                        │
│                                         │
│  Started:     08:32 AM                  │
│  Current:     On Shift (2h 15m)         │
│  Breaks:      1 (15 min)                │
│  Total Today: 4h 30m                    │
└─────────────────────────────────────────┘
```

---

## API Endpoints

### Existing (Backend Ready)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance/status` | Get current shift status |
| POST | `/attendance/clock-in` | Start shift |
| POST | `/attendance/clock-out` | End shift |
| GET | `/attendance/today` | Get today's records |
| GET | `/attendance/history` | Get historical records |
| GET | `/attendance/weekly-hours` | Get weekly total |

### New Endpoints Needed
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attendance/heartbeat` | Update last-active timestamp |
| POST | `/attendance/pause` | Pause shift (break) |
| POST | `/attendance/resume` | Resume from break |
| GET | `/attendance/daily-summary` | Aggregated daily stats |

---

## Implementation Phases

### Phase 1 (Current Sprint) ✅
- [x] Clock-in/clock-out functionality
- [x] Shift status in TopBar
- [x] Live timer display
- [x] Basic persistence across refresh
- [x] Today's attendance history

### Phase 2 (Next Sprint)
- [ ] Idle detection with warning modal
- [ ] Auto-pause on extended idle
- [ ] Break tracking (pause/resume)
- [ ] Daily summary widget on dashboard
- [ ] Weekly hours display

### Phase 3 (Future)
- [ ] Location verification
- [ ] Device fingerprinting
- [ ] Supervisor override (correct times)
- [ ] Export timesheets
- [ ] Integration with payroll

---

## Acceptance Criteria

### Clock In/Out
- [x] User can start shift with one click
- [x] User can end shift with one click
- [x] Shift status persists across page refresh
- [x] Cannot double clock-in

### Live Timer
- [x] Timer shows elapsed time since clock-in
- [x] Timer updates every second
- [x] Timer survives page refresh
- [ ] Timer visible in TopBar for shift-enabled roles

### Idle Detection (Phase 2)
- [ ] Warning appears after 5 min idle
- [ ] Shift pauses after 10 min with no response
- [ ] Activity resumes shift automatically
- [ ] Idle periods logged separately

### Security
- [x] Timestamps set server-side
- [x] Audit log captures clock events
- [x] Rate limiting on API endpoints
- [ ] Location recorded (optional)

---

## Error Handling

| Scenario | User Message | Action |
|----------|--------------|--------|
| Already clocked in | "You're already on shift" | Show current shift status |
| Not clocked in | "You're not on shift" | Prompt to clock in |
| Network error | "Connection lost. Retrying..." | Retry with backoff |
| Session expired | "Please log in again" | Redirect to login |
| Rate limited | "Too many requests" | Disable button temporarily |

---

## i18n Keys

```javascript
'shift.startShift': 'Start Shift'
'shift.endShift': 'End Shift'
'shift.onShift': 'On Shift'
'shift.offShift': 'Off Shift'
'shift.notOnShift': 'Not on shift'
'shift.clickToStart': 'Click to Start Shift'
'shift.elapsed': 'Elapsed'
'shift.todayTotal': 'Today\'s Total'
'shift.weeklyTotal': 'This Week'
'shift.idleWarning': 'Are you still working?'
'shift.idleMessage': 'You\'ve been idle for {{minutes}} minutes.'
'shift.stillHere': 'I\'m Here'
'shift.takeBreak': 'Take a Break'
'shift.autoPauseIn': 'Auto-pause in: {{time}}'
'shift.paused': 'Shift Paused'
'shift.resume': 'Resume Shift'
'shift.startedAt': 'Started at {{time}}'
'shift.breaks': '{{count}} break(s)'
```
