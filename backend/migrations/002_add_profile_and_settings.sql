-- Migration: 002_add_profile_and_settings
-- Description: Add profile fields to users table, create user_settings and user_sessions tables
-- Date: 2026-01-25

-- ============================================
-- 1. Add new columns to users table
-- ============================================

-- Display name and secondary phone
ALTER TABLE users ADD COLUMN IF NOT EXISTS "displayName" varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "secondaryPhone" varchar(20);

-- Profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS "profilePhotoUrl" varchar(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "personalEmail" varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "dateOfBirth" date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "nationalId" varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "city" varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "region" varchar(100);

-- Emergency contact (JSONB)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emergencyContact" jsonb;

-- Employment details
ALTER TABLE users ADD COLUMN IF NOT EXISTS "employeeId" varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "hireDate" date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "contractType" varchar(20);

-- Skills & Qualifications (JSONB arrays)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "certifications" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "languages" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "equipmentCompetencies" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "specialSkills" text;

-- Work Preferences (JSONB)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "workPreferences" jsonb;

-- Security fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastPasswordChangeAt" timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "forcePasswordChange" boolean DEFAULT false;

-- ============================================
-- 2. Create user_settings table
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Settings sections (JSONB for flexibility)
  appearance jsonb DEFAULT '{}'::jsonb,
  notifications jsonb DEFAULT '{}'::jsonb,
  tables jsonb DEFAULT '{}'::jsonb,
  calendar jsonb DEFAULT '{}'::jsonb,
  map jsonb DEFAULT '{}'::jsonb,
  gps jsonb DEFAULT '{}'::jsonb,
  photo jsonb DEFAULT '{}'::jsonb,
  offline jsonb DEFAULT '{}'::jsonb,
  mission jsonb DEFAULT '{}'::jsonb,
  shift jsonb DEFAULT '{}'::jsonb,
  help jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

-- Index on userId for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings("userId");

-- ============================================
-- 3. Create user_sessions table
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session token (hashed)
  token varchar(500) NOT NULL,
  
  -- Device info
  "deviceType" varchar(50),
  browser varchar(255),
  os varchar(255),
  
  -- Location info
  "ipAddress" varchar(50),
  city varchar(100),
  country varchar(100),
  
  -- Session state
  "isActive" boolean DEFAULT true,
  "expiresAt" timestamp NOT NULL,
  "lastActiveAt" timestamp,
  "revokedAt" timestamp,
  
  -- Timestamps
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions("expiresAt");
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions("isActive") WHERE "isActive" = true;

-- ============================================
-- 4. Create trigger for updated_at
-- ============================================

-- Function to update the updatedAt column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_sessions
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Create default settings for existing users
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
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_settings WHERE user_settings."userId" = users.id
);

-- ============================================
-- Done!
-- ============================================

COMMENT ON TABLE user_settings IS 'User preferences and settings for appearance, notifications, and app behavior';
COMMENT ON TABLE user_sessions IS 'Active user sessions for multi-device session management';
