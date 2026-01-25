-- Migration: Add notifications and attendances tables
-- Date: 2026-01-25
-- Description: Creates the notifications and attendances tables for the notification system and shift tracking

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    "actionUrl" VARCHAR(255),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = FALSE;

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt" DESC);

-- ============================================
-- ATTENDANCES TABLE (for clock in/out tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "clockIn" TIMESTAMP WITH TIME ZONE NOT NULL,
    "clockOut" TIMESTAMP WITH TIME ZONE,
    "hoursWorked" DECIMAL(5, 2),
    notes VARCHAR(255),
    "clockInLocation" POINT,
    "clockOutLocation" POINT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_attendances_user_id ON attendances("userId");

-- Index for finding open shifts (no clock out)
CREATE INDEX IF NOT EXISTS idx_attendances_open_shifts ON attendances("clockOut") WHERE "clockOut" IS NULL;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_attendances_clock_in ON attendances("clockIn" DESC);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE notifications IS 'User notifications for system events, alerts, and messages';
COMMENT ON TABLE attendances IS 'Employee attendance records for shift clock in/out tracking';

-- Done!
SELECT 'Migration completed: notifications and attendances tables created' AS status;
