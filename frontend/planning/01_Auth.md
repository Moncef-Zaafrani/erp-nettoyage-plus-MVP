# 01 — Auth Module

## Pages

### Login
- Email + password fields.
- "Remember me" checkbox.
- "Forgot password?" link → Password Reset page.
- Submit button.
- Error states: invalid credentials, account locked, account archived.
- On success: redirect to Dashboard (or last visited page).
- Super Admin single-session enforcement: if already logged in elsewhere, show warning and option to force logout other session.
- 5 buttons, Demo only, for quick login with each role (Super Admin, Admin, Supervisor, Agent, Client)

### Password Reset (Request)
- Email field.
- Submit button → sends reset link.
- Success message: "If this email exists, a reset link was sent."
- ! For the demo only you will provide the sucess message like this "If this email exists, a reset link was sent. You will be sent to the password reset page for this demo!"
- Back to Login link. (demo the password reset)

### Password Reset (Set New)
- Accessed via emailed token link.
- New password + confirm password fields.
- Password strength indicator.
- Submit → on success redirect to Login with success toast.
- Token expired: show error + link to request new reset.

### Register (Admin-initiated only)
- No public registration. Admins create users from Users page.
- New user receives email invite with temporary password or magic link.

---

## Session Behavior
- JWT stored securely (httpOnly cookie preferred, or secure storage).
- Auto-refresh token before expiry.
- Idle timeout warning modal (e.g., "Session expiring in 2 minutes — Stay logged in?").
- On logout: clear tokens, redirect to Login.

---

## Role-based Redirects
- After login, redirect based on role:
  - Super Admin / Admin / Superviseur → Dashboard.
  - Agent → Missions page (mobile-first view).
  - Client → Client Portal (Phase 2, show "Coming soon" for now).

---

## Acceptance Criteria
- Valid login → Dashboard. (or last visited page)
- Invalid credentials → clear error message.
- Password reset email sent (dev: logged to console).
- Expired token → user-friendly error.
- Super Admin can force-logout other sessions.
