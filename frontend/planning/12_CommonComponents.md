# 12 — Common Components & Patterns

## Purpose
- Reusable UI elements across all pages.
- Consistent behavior and appearance.

---

## Data Tables
- Sortable columns (click header).
- Pagination: configurable rows per page.
- Row selection (checkbox) for bulk actions.
- Loading skeleton while fetching.
- Empty state with message and primary action.
- Responsive: horizontal scroll or card view on mobile.

---

## Modals
- Centered overlay with backdrop.
- Close via X button, backdrop click, or Escape key.
- Confirmation modals for destructive actions: clear title, impact summary, Cancel/Confirm buttons.
- Form modals: validation before submit.

---

## Forms
- Inline validation: show error below field on blur.
- Required field indicator (asterisk or label).
- Disabled fields: greyed with tooltip if permission-based.
- Loading state on submit button.
- Success toast on save.

---

## Toasts / Snackbars
- Appear bottom-right (or top-right).
- Types: success, error, warning, info.
- Auto-dismiss after 5 seconds (configurable).
- Dismissible manually.

---

## Badges & Status Pills
- Color-coded by meaning (e.g., green = active, red = archived, yellow = pending).
- Consistent across pages.

---

## Search & Filters
- Search input with debounce (300ms).
- Filter dropdowns/chips.
- "Clear filters" action.
- URL reflects filters (shareable, bookmarkable).

---

## Loading States
- Skeleton loaders for content areas.
- Spinner for actions (buttons).
- Page-level loading bar (top of viewport).

---

## Error States
- Inline field errors.
- Page-level error: friendly message + retry button.
- 404 page: "Page not found" with link to Dashboard.
- 403 page: "Access denied" with explanation.

---

## Empty States
- Illustration or icon.
- Helpful message.
- Primary action button (e.g., "Create your first client").
- Can be disabled via settings.

---

## Keyboard Navigation
- Tab through interactive elements.
- Enter to submit forms.
- Escape to close modals.
- Arrow keys in dropdowns.

---

## Accessibility
- Labels on all inputs.
- Aria attributes for dynamic content.
- Sufficient color contrast.
- Focus indicators visible.
