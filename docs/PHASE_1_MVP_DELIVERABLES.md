# Phase 1 — MVP Deliverables

## Overview
Concise list of features and acceptance criteria for the Phase 1 MVP (operational launch). Focus is on core operations: clients, contracts, sites, interventions, basic personnel management, agent mobile workflow, notifications, and roles/permissions.

## Deliverables

- Clients & Contracts
  - CRUD for clients and contracts (permanent and one-off).
  - Contract statuses (active, suspended, finished) and link to sites.
  - Acceptance: create client + create permanent contract with schedule and status updates.

- Sites / Locations
  - CRUD for sites, address, hours, specific requirements and association to client and contracts.
  - Acceptance: create site and link it to a client and a contract.

- Interventions & Planning
  - Create recurring (contract) and single interventions, basic calendar view, assign agents, reschedule and cancel flows.
  - Acceptance: schedule recurring intervention and create a one-off intervention; assign an agent.

- Personnel (Basic HR)
  - Employee profile, absence tracking, assignment to interventions, simple time check-in record.
  - Acceptance: create employee, record absence, assign to an intervention.

- Agent Mobile App (Core flows)
  - Agent receives missions, start/finish tasks, GPS check-in, photo upload, and basic offline retry behavior.
  - Acceptance: agent app receives a mission, performs GPS check-in and uploads at least one photo when completing a mission.

- Notifications & Communication
  - In-app and email/push notifications for new/updated missions, assignments, and important changes.
  - Acceptance: notification sent on assignment change and mission status change.

- Roles & Permissions
  - Roles: Admin, Supervisor, Agent, Client. Role-based access control for APIs and UI.
  - Acceptance: role enforcement (e.g., client cannot modify interventions).

## Non-functional & Ops
- Authentication (JWT), input validation, logging, basic error handling.
- Database migrations and environment-based config (dev/prod).
- Minimal monitoring / logs for critical flows.

## Definition of Done
- Implemented API endpoints and minimal UI for each deliverable.
- Unit and integration tests for critical flows; at least one E2E happy-path per feature.
- Short user guide / README with how to run locally and environment variables required.
- Demo script or checklist to validate acceptance criteria.

## Out of Scope for Phase 1
- Billing and payments, advanced stock management, full offline sync, advanced analytics and dashboards, multi-language support beyond basic localization.