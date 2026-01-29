# Users & Clients Pages — Implementation Plan (Updated January 2026)

## Overview

Modern card/table view pages for managing Users and Clients, with filtering, sorting, batch operations, and role-based access control.

---

## 1. Navigation Structure

### Users Routes (by role type)
| Route | Description | Who can access |
|-------|-------------|----------------|
| `/users` | All users (filtered by viewer permissions) | Super Admin, Admin |
| `/users/admins` | Admin users only | Super Admin only |
| `/users/supervisors` | Supervisor users (Chef d'équipe) | Super Admin, Admin |
| `/users/agents` | Agent users (cleaning staff) | Super Admin, Admin, Supervisor* |

*Supervisors only see their assigned agents

### Clients Routes (by client type)
| Route | Description | Who can access |
|-------|-------------|----------------|
| `/clients` | All clients | Super Admin, Admin |
| `/clients/companies` | Company clients (COMPANY, MULTI_SITE) | Super Admin, Admin |
| `/clients/individuals` | Individual clients (INDIVIDUAL) | Super Admin, Admin |

### Navigation Links (already configured)
```
Users
├── All Users → /users
├── Admins → /users/admins
├── Supervisors → /users/supervisors
└── Agents → /users/agents

Clients
├── All Clients → /clients
├── Companies → /clients/companies
└── Individuals → /clients/individuals
```

---

## 2. Access Control & Permissions

### Role Hierarchy
```
SUPER_ADMIN > ADMIN > SUPERVISOR > AGENT
                                    └── CLIENT (separate hierarchy)
```

### Permission Matrix — Users

| Viewer Role | Can See | Can Create | Can Edit | Can Archive |
|-------------|---------|------------|----------|-------------|
| SUPER_ADMIN | All users except themselves | All roles | All fields | Yes |
| ADMIN | Supervisors, Agents, Clients | Supervisors, Agents, Clients | All fields (own scope) | Yes |
| SUPERVISOR | Only assigned Agents | No | Notes only | No |
| AGENT | ❌ No access | ❌ | ❌ | ❌ |
| CLIENT | ❌ No access | ❌ | ❌ | ❌ |

### Permission Matrix — Clients

| Viewer Role | Can See | Can Create | Can Edit | Can Archive |
|-------------|---------|------------|----------|-------------|
| SUPER_ADMIN | All clients | Yes | All fields | Yes |
| ADMIN | All clients | Yes | All fields | Yes |
| SUPERVISOR | ❌ No access | ❌ | ❌ | ❌ |
| AGENT | ❌ No access | ❌ | ❌ | ❌ |
| CLIENT | Own profile only (separate portal) | ❌ | Limited | ❌ |

---

## 3. UI Components

### 3.1 View Toggle
- Two views: **Card View** (default) and **Table View**
- Toggle button in top-right (icons: grid/list)
- View preference persisted in user settings

### 3.2 Card View — User Card
```
┌──────────────────────────────────────────────────┐
│ [Avatar]  Name                          [•••]    │
│           🛡️ Role Badge                          │
│                                                  │
│ ✉️ email@example.com                             │
│ 📞 +33 6 12 34 56 78                             │
│                                                  │
│ [Active]                    Il y a 5 min        │
└──────────────────────────────────────────────────┘
```

Fields shown:
- Avatar (initials or photo)
- Full name
- Role icon + label (shield for Admin, users-cog for Supervisor, user-check for Agent)
- Email
- Phone
- Zone (for Supervisors/Agents)
- Status badge: `Active` (green), `Inactive` (gray), `Pending` (amber), `Archived` (red)
- Last active time (relative: "Il y a X min/h/j" or "Jamais")

### 3.3 Card View — Client Card

**Company Card:**
```
┌──────────────────────────────────────────────────┐
│ [🏢]  Company Name                      [•••]    │
│       Contact: Person Name                       │
│                                                  │
│ ✉️ contact@company.com                           │
│ 📞 +33 1 23 45 67 89                             │
│ 📍 123 Street, City                              │
│                                                  │
│ ⊙ 12 sites    📄 3 contrats actifs              │
│                                                  │
│ [Actuel]                    Depuis janv. 2023   │
└──────────────────────────────────────────────────┘
```

**Individual Card:**
```
┌──────────────────────────────────────────────────┐
│ [👤]  Person Name                       [•••]    │
│                                                  │
│ ✉️ person@email.com                              │
│ 📞 +33 6 12 34 56 78                             │
│ 📍 15 Rue de la Paix, Paris                      │
│                                                  │
│ ⊙ 1 site     📄 1 contrat actif                 │
│                                                  │
│ [Actuel]                    Depuis févr. 2024   │
└──────────────────────────────────────────────────┘
```

### 3.4 Table View Columns

**Users Table:**
| Name | Email | Role | Status | Zone | Supervisor | Last Active | Actions |
|------|-------|------|--------|------|------------|-------------|---------|

**Clients Table:**
| Name | Type | Email | Phone | Sites | Contracts | Status | Member Since | Actions |
|------|------|-------|-------|-------|-----------|--------|--------------|---------|

Table features:
- Sortable columns (click header)
- Sticky header
- Row hover highlight
- Actions dropdown

### 3.5 Filter Drawer (Side Panel)

Opens from right side when filter icon clicked.

**Users Filters:**
- Status: Active, Inactive, Pending, Archived (multi-select)
- Supervisor: Dropdown (only for Agents)
- Zone: Dropdown (multi-select)
- Last Online: Today, This Week, This Month, Older, Never
- Show Archived: Toggle (off by default)

**Clients Filters:**
- Status: Active, Inactive, Archived (multi-select)
- Type: Company, Multi-Site, Individual (multi-select)
- Has Active Contract: Yes, No, Any
- Show Archived: Toggle (off by default)

### 3.6 Actions Dropdown (•••)

**For Users (based on viewer permissions):**
- View Profile
- Edit
- Reset Password (Admin+)
- ─────────────
- Deactivate (red text, requires confirmation)

**For Clients:**
- View Details
- Edit
- Add Site (WIP if sites not ready)
- Create Contract (WIP if contracts not ready)
- ─────────────
- Archive (red text, requires confirmation)

### 3.7 Right-Click Context Menu
Same as actions dropdown, plus:
- Select (enables multi-select mode for that item)

### 3.8 Batch Actions Bar
Appears at bottom when items are selected:
```
┌─────────────────────────────────────────────────────────────────────┐
│ ☑️ 5 selected    [Activate] [Deactivate] [Assign...] [Clear]       │
└─────────────────────────────────────────────────────────────────────┘
```

**Users Batch Actions:**
- Activate (restore)
- Deactivate (archive)
- Assign Supervisor
- Assign Zone/Site

**Clients Batch Actions:**
- Activate
- Archive

---

## 4. User Statuses

### Employee Statuses (Admin, Supervisor, Agent)
| Status | Display | Badge Color | Description |
|--------|---------|-------------|-------------|
| ACTIVE | Active / Actif / نشط | Green | Currently employed, full access |
| INACTIVE | Inactive / Inactif / غير نشط | Gray | Temporarily disabled |
| Pending* | En attente / قيد الانتظار | Amber | Email not verified (emailVerified=false) |
| ARCHIVED | Archived / Archivé / مؤرشف | Red | Soft deleted |

*Pending is a computed status: status=ACTIVE but emailVerified=false

### Client Statuses
| Status | Display | Badge Color | Description |
|--------|---------|-------------|-------------|
| ACTIVE | Actuel / Current | Green | Active client |
| INACTIVE | Inactif / Inactive | Gray | Paused relationship |
| PROSPECT | Prospect | Blue | Potential client |
| ARCHIVED | Archivé / Archived | Red | Soft deleted |

---

## 5. Empty States

When no results match filters, show a friendly message:

**Users:**
> 🔍 "No users found matching your filters. Maybe they're all on a coffee break?"

**Clients:**
> 🏢 "No clients here yet. Time to grow that business!"

---

## 6. Responsive Behavior

| Screen Size | Card View | Table View |
|-------------|-----------|------------|
| Desktop (>1200px) | 4 cards per row | Full table |
| Tablet (768-1200px) | 2-3 cards per row | Horizontal scroll |
| Mobile (<768px) | 1 card (simplified) | Auto-switch to card list |

Mobile simplifications:
- Hide secondary fields (phone, address)
- Compact status badges
- Swipe for actions

---

## 7. Backend Requirements

### User Entity Additions (if not present)
- `lastLoginAt`: Already exists ✅
- `emailVerified`: Already exists ✅
- `supervisorId`: Already exists ✅

### Zone Support
- Zone entity: Already exists ✅
- AgentZoneAssignment: Already exists ✅
- Need endpoint to get zones list for filter dropdown

### Client Entity Additions
- `sitesCount`: Computed from Sites relation
- `activeContractsCount`: Computed from Contracts relation

### API Endpoints Needed

**Users:**
- `GET /users` - List with filters (role, status, zone, supervisor)
- `GET /users/:id` - Get single user
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Soft delete (archive)
- `POST /users/batch/activate` - Batch activate
- `POST /users/batch/deactivate` - Batch deactivate
- `POST /users/batch/assign-supervisor` - Batch assign supervisor
- `POST /users/batch/assign-zone` - Batch assign zone

**Clients:**
- `GET /clients` - List with filters (type, status, hasActiveContract)
- `GET /clients/:id` - Get single client with counts
- `POST /clients` - Create client
- `PATCH /clients/:id` - Update client
- `DELETE /clients/:id` - Soft delete (archive)
- `POST /clients/batch/activate` - Batch activate
- `POST /clients/batch/archive` - Batch archive

**Zones:**
- `GET /zones` - List all zones for dropdowns

---

## 8. File Structure

```
frontend/src/
├── pages/
│   ├── users/
│   │   ├── UsersPage.tsx       # Main users page with view toggle
│   │   ├── UserDetailPage.tsx  # Single user detail view
│   │   └── index.ts
│   └── clients/
│       ├── ClientsPage.tsx     # Main clients page with view toggle
│       ├── ClientDetailPage.tsx
│       └── index.ts
├── components/
│   ├── users/
│   │   ├── UserCard.tsx        # Card view component
│   │   ├── UserTable.tsx       # Table view component
│   │   ├── UserFilters.tsx     # Filter drawer content
│   │   └── UserBatchBar.tsx    # Batch actions bar
│   ├── clients/
│   │   ├── ClientCard.tsx
│   │   ├── ClientTable.tsx
│   │   ├── ClientFilters.tsx
│   │   └── ClientBatchBar.tsx
│   └── shared/
│       ├── ViewToggle.tsx      # Card/Table toggle button
│       ├── FilterDrawer.tsx    # Right-side drawer wrapper
│       ├── StatusBadge.tsx     # Reusable status badge
│       ├── ActionDropdown.tsx  # •••  dropdown menu
│       └── ConfirmModal.tsx    # Confirmation dialog
└── services/
    └── api.ts                  # Add usersApi, clientsApi, zonesApi
```

---

## 9. Implementation Order

1. ✅ Navigation structure (already done)
2. Add API endpoints to frontend (usersApi, clientsApi, zonesApi)
3. Create shared components (ViewToggle, FilterDrawer, StatusBadge, etc.)
4. Create UserCard and ClientCard components
5. Create UsersPage with routing for /users, /users/admins, etc.
6. Create ClientsPage with routing for /clients, /clients/companies, etc.
7. Add table views (UserTable, ClientTable)
8. Add filter drawer functionality
9. Add batch selection and actions
10. Add right-click context menu
11. Add translations (i18n)
12. Mobile responsiveness polish

---

## 10. Translations Needed

### English (en)
```javascript
// Users
'users.title': 'Users',
'users.subtitle': 'Manage users and their permissions',
'users.newUser': 'New User',
'users.searchPlaceholder': 'Search users...',
'users.noUsers': 'No users found',
'users.noUsersMessage': "Maybe they're all on a coffee break?",
'users.status.active': 'Active',
'users.status.inactive': 'Inactive',
'users.status.pending': 'Pending',
'users.status.archived': 'Archived',
'users.lastActive': 'Last active',
'users.never': 'Never',
'users.filters.title': 'Filters',
'users.filters.status': 'Status',
'users.filters.supervisor': 'Supervisor',
'users.filters.zone': 'Zone',
'users.filters.lastOnline': 'Last Online',
'users.filters.showArchived': 'Show Archived',
'users.actions.viewProfile': 'View Profile',
'users.actions.edit': 'Edit',
'users.actions.resetPassword': 'Reset Password',
'users.actions.deactivate': 'Deactivate',
'users.actions.activate': 'Activate',
'users.actions.select': 'Select',
'users.batch.selected': '{{count}} selected',
'users.batch.assignSupervisor': 'Assign Supervisor',
'users.batch.assignZone': 'Assign Zone',

// Clients
'clients.title': 'Clients',
'clients.subtitle': '{{count}} active clients',
'clients.newClient': 'New Client',
'clients.searchPlaceholder': 'Search clients...',
'clients.noClients': 'No clients found',
'clients.noClientsMessage': 'Time to grow that business!',
'clients.contact': 'Contact',
'clients.sites': 'sites',
'clients.activeContracts': 'active contracts',
'clients.memberSince': 'Since',
'clients.status.active': 'Current',
'clients.status.inactive': 'Inactive',
'clients.status.prospect': 'Prospect',
'clients.status.archived': 'Archived',
'clients.type.company': 'Company',
'clients.type.multiSite': 'Multi-Site',
'clients.type.individual': 'Individual',
'clients.actions.viewDetails': 'View Details',
'clients.actions.edit': 'Edit',
'clients.actions.addSite': 'Add Site',
'clients.actions.createContract': 'Create Contract',
'clients.actions.archive': 'Archive',

// Common
'common.cardView': 'Card View',
'common.tableView': 'Table View',
'common.filters': 'Filters',
'common.clearFilters': 'Clear Filters',
'common.applyFilters': 'Apply',
'common.selectMode': 'Select',
'common.clearSelection': 'Clear Selection',
```

### French (fr) and Arabic (ar)
Similar structure with translations...

---

## 11. WIP Features (Phase 2+)

These should show WIP badge when clicked:
- Custom Roles management
- Export to CSV with audit history
- Role analytics chart
- Advanced reporting
- Bulk CSV import preview

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| Jan 2026 | Complete rewrite with modern card/table view, filter drawer, batch actions | AI |
| Original | Initial planning document | Zied |
