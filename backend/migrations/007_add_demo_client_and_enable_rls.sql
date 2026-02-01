-- Migration: 007_add_demo_client_and_enable_rls
-- Description: Add demo client record and enable RLS on all tables
-- Date: 2026-02-01

-- ============================================
-- 1. Create demo client linked to demo user
-- ============================================

-- First, get the demo client user's ID and create a client record
INSERT INTO clients (
  id,
  "clientCode",
  name,
  type,
  "userId",
  email,
  phone,
  status,
  "contactPerson",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  'CLI-0001',
  'Demo Client Company',
  'COMPANY',
  id,
  'client@nettoyageplus.com',
  '+33 6 00 00 00 05',
  'CURRENT',
  'Demo Client',
  NOW(),
  NOW()
FROM users
WHERE email = 'client@nettoyageplus.com'
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. Enable RLS on all tables
-- Since we use NestJS API (not PostgREST directly),
-- we create permissive policies for the service role
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_zone_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_zone_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Create permissive policies for service role
-- The NestJS backend connects with the service role,
-- which bypasses RLS. These policies are for safety.
-- ============================================

-- Users table
DROP POLICY IF EXISTS "service_role_all_users" ON users;
CREATE POLICY "service_role_all_users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User settings
DROP POLICY IF EXISTS "service_role_all_user_settings" ON user_settings;
CREATE POLICY "service_role_all_user_settings" ON user_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User sessions
DROP POLICY IF EXISTS "service_role_all_user_sessions" ON user_sessions;
CREATE POLICY "service_role_all_user_sessions" ON user_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User notes
DROP POLICY IF EXISTS "service_role_all_user_notes" ON user_notes;
CREATE POLICY "service_role_all_user_notes" ON user_notes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User zone assignments
DROP POLICY IF EXISTS "service_role_all_user_zone_assignments" ON user_zone_assignments;
CREATE POLICY "service_role_all_user_zone_assignments" ON user_zone_assignments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User site assignments
DROP POLICY IF EXISTS "service_role_all_user_site_assignments" ON user_site_assignments;
CREATE POLICY "service_role_all_user_site_assignments" ON user_site_assignments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Clients
DROP POLICY IF EXISTS "service_role_all_clients" ON clients;
CREATE POLICY "service_role_all_clients" ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Sites
DROP POLICY IF EXISTS "service_role_all_sites" ON sites;
CREATE POLICY "service_role_all_sites" ON sites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Site assignments
DROP POLICY IF EXISTS "service_role_all_site_assignments" ON site_assignments;
CREATE POLICY "service_role_all_site_assignments" ON site_assignments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Contracts
DROP POLICY IF EXISTS "service_role_all_contracts" ON contracts;
CREATE POLICY "service_role_all_contracts" ON contracts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Zones
DROP POLICY IF EXISTS "service_role_all_zones" ON zones;
CREATE POLICY "service_role_all_zones" ON zones
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Agent zone assignments
DROP POLICY IF EXISTS "service_role_all_agent_zone_assignments" ON agent_zone_assignments;
CREATE POLICY "service_role_all_agent_zone_assignments" ON agent_zone_assignments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Interventions
DROP POLICY IF EXISTS "service_role_all_interventions" ON interventions;
CREATE POLICY "service_role_all_interventions" ON interventions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Schedules
DROP POLICY IF EXISTS "service_role_all_schedules" ON schedules;
CREATE POLICY "service_role_all_schedules" ON schedules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Checklist templates
DROP POLICY IF EXISTS "service_role_all_checklist_templates" ON checklist_templates;
CREATE POLICY "service_role_all_checklist_templates" ON checklist_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Checklist instances
DROP POLICY IF EXISTS "service_role_all_checklist_instances" ON checklist_instances;
CREATE POLICY "service_role_all_checklist_instances" ON checklist_instances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Checklist items
DROP POLICY IF EXISTS "service_role_all_checklist_items" ON checklist_items;
CREATE POLICY "service_role_all_checklist_items" ON checklist_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Absences
DROP POLICY IF EXISTS "service_role_all_absences" ON absences;
CREATE POLICY "service_role_all_absences" ON absences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "service_role_all_notifications" ON notifications;
CREATE POLICY "service_role_all_notifications" ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Attendances
DROP POLICY IF EXISTS "service_role_all_attendances" ON attendances;
CREATE POLICY "service_role_all_attendances" ON attendances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Shift breaks
DROP POLICY IF EXISTS "service_role_all_shift_breaks" ON shift_breaks;
CREATE POLICY "service_role_all_shift_breaks" ON shift_breaks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Reports
DROP POLICY IF EXISTS "service_role_all_reports" ON reports;
CREATE POLICY "service_role_all_reports" ON reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Audit logs
DROP POLICY IF EXISTS "service_role_all_audit_logs" ON audit_logs;
CREATE POLICY "service_role_all_audit_logs" ON audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. Fix function search_path
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Done! RLS enabled, demo client created
-- ============================================
