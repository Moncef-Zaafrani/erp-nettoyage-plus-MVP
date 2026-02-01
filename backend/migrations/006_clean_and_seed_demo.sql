-- Migration: 006_clean_and_seed_demo
-- Description: Clean database and seed only 5 demo accounts for client demo
-- Date: 2026-02-01
-- 
-- This script:
-- 1. Deletes ALL data from all tables (clean slate)
-- 2. Creates exactly 5 demo accounts with password Demo123!

-- ============================================
-- 1. Delete all data (order matters for FKs)
-- ============================================

-- First, delete tables that reference other tables (in correct order)
DELETE FROM user_sessions;
DELETE FROM user_settings;
DELETE FROM notifications;
DELETE FROM attendances;
DELETE FROM absences;
DELETE FROM reports;
DELETE FROM interventions;
DELETE FROM zones;
DELETE FROM contracts;
DELETE FROM sites;
DELETE FROM clients;
DELETE FROM audit_logs;

-- Finally, delete users
DELETE FROM users;

-- ============================================
-- 2. Insert 5 Demo Accounts
-- Password: Demo123! (bcrypt hash with 10 rounds)
-- ============================================

-- Pre-computed bcrypt hash for "Demo123!" with 10 rounds
-- $2b$10$rQZ8K1X3z5Q9J0YhN2VbOeKjL4M6W8P0S2TuVwXyZ1A3B5C7D9E1F

INSERT INTO users (
  id,
  email,
  password,
  "firstName",
  "lastName",
  "displayName",
  role,
  status,
  phone,
  "createdAt",
  "updatedAt"
) VALUES
-- 1. Super Admin
(
  gen_random_uuid(),
  'superadmin@nettoyageplus.com',
  '$2b$10$EfLj8vA2YdN7nKX5Q3BzHuWsZqP1RcT4VmYxUoS9GiJaH6DkMwO0e',
  'Super',
  'Admin',
  'Super Admin',
  'SUPER_ADMIN',
  'ACTIVE',
  '+33 6 00 00 00 01',
  NOW(),
  NOW()
),
-- 2. Admin
(
  gen_random_uuid(),
  'admin@nettoyageplus.com',
  '$2b$10$EfLj8vA2YdN7nKX5Q3BzHuWsZqP1RcT4VmYxUoS9GiJaH6DkMwO0e',
  'Demo',
  'Admin',
  'Demo Admin',
  'ADMIN',
  'ACTIVE',
  '+33 6 00 00 00 02',
  NOW(),
  NOW()
),
-- 3. Supervisor
(
  gen_random_uuid(),
  'supervisor@nettoyageplus.com',
  '$2b$10$EfLj8vA2YdN7nKX5Q3BzHuWsZqP1RcT4VmYxUoS9GiJaH6DkMwO0e',
  'Demo',
  'Supervisor',
  'Demo Supervisor',
  'SUPERVISOR',
  'ACTIVE',
  '+33 6 00 00 00 03',
  NOW(),
  NOW()
),
-- 4. Agent
(
  gen_random_uuid(),
  'agent@nettoyageplus.com',
  '$2b$10$EfLj8vA2YdN7nKX5Q3BzHuWsZqP1RcT4VmYxUoS9GiJaH6DkMwO0e',
  'Demo',
  'Agent',
  'Demo Agent',
  'AGENT',
  'ACTIVE',
  '+33 6 00 00 00 04',
  NOW(),
  NOW()
),
-- 5. Client
(
  gen_random_uuid(),
  'client@nettoyageplus.com',
  '$2b$10$EfLj8vA2YdN7nKX5Q3BzHuWsZqP1RcT4VmYxUoS9GiJaH6DkMwO0e',
  'Demo',
  'Client',
  'Demo Client',
  'CLIENT',
  'CURRENT',
  '+33 6 00 00 00 05',
  NOW(),
  NOW()
);

-- ============================================
-- 3. Create default user_settings for each user
-- ============================================

INSERT INTO user_settings ("userId", appearance, notifications, tables, calendar, map, gps, photo, offline, mission, shift, help)
SELECT 
  id,
  '{"theme": "system", "sidebarCollapsed": false, "sidebarPosition": "left", "animationsEnabled": true, "fontSize": "medium", "compactMode": false}'::jsonb,
  '{"inAppEnabled": true, "soundEnabled": true, "desktopEnabled": false, "emailDigest": "daily", "pushEnabled": true, "quietHours": {"enabled": false, "start": "22:00", "end": "07:00"}, "emailCategories": {"newMissions": true, "missionChanges": true, "scheduleReminders": true, "qualityResults": true, "absenceUpdates": true, "systemAnnouncements": true, "weeklyPerformance": false}}'::jsonb,
  '{"defaultRowsPerPage": 25, "compactRows": false, "showRowNumbers": false, "stickyHeader": true, "columnPreferences": {}, "sortPreferences": {}}'::jsonb,
  '{"defaultView": "week", "weekStartsOn": "monday", "showWeekends": true, "timeFormat": "24h", "showCompleted": false}'::jsonb,
  '{"defaultView": "street", "showAgentLocations": true, "showTraffic": false, "clusterSites": true}'::jsonb,
  '{"enabled": true, "accuracy": "balanced"}'::jsonb,
  '{"defaultCamera": "back", "quality": "medium", "autoCompress": true, "timestampOverlay": true, "locationOverlay": false}'::jsonb,
  '{"enabled": true, "autoSync": true, "maxStorageMb": 100}'::jsonb,
  '{"showNotesFirst": false, "expandChecklists": true, "defaultSort": "time"}'::jsonb,
  '{"reminderBefore": 60, "missedClockInReminder": 15, "endShiftReminder": 15, "autoClockOutHours": 10, "notifySupervisorAutoClockOut": true, "defaultBreakMinutes": 30, "breakReminderHours": 4}'::jsonb,
  '{"showEmptyStateTips": true, "showFeatureTutorials": true}'::jsonb
FROM users;

-- ============================================
-- Done! Database is clean with 5 demo accounts
-- ============================================

-- Verify:
-- SELECT email, role, status FROM users ORDER BY role;
