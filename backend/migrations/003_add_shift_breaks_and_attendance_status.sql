-- Migration: Add shift breaks table and enhance attendance tracking
-- Date: 2025-01-XX
-- Description: Adds pause/resume functionality for shifts with break tracking

-- Add new columns to attendances table
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP,
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 0;

-- Create shift_breaks table for tracking breaks during a shift
CREATE TABLE IF NOT EXISTS shift_breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
    break_start TIMESTAMP NOT NULL DEFAULT NOW(),
    break_end TIMESTAMP,
    duration_minutes INTEGER,
    break_type VARCHAR(20) NOT NULL DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups by attendance
CREATE INDEX IF NOT EXISTS idx_shift_breaks_attendance_id ON shift_breaks(attendance_id);

-- Create index for finding open breaks
CREATE INDEX IF NOT EXISTS idx_shift_breaks_open ON shift_breaks(attendance_id, break_end) WHERE break_end IS NULL;

-- Add comment for documentation
COMMENT ON TABLE shift_breaks IS 'Tracks break periods within a shift/attendance record';
COMMENT ON COLUMN attendances.status IS 'Shift status: active, paused, or completed';
COMMENT ON COLUMN attendances.last_heartbeat IS 'Last heartbeat timestamp for idle detection';
COMMENT ON COLUMN attendances.device_id IS 'Device identifier for multi-device tracking';
COMMENT ON COLUMN attendances.break_minutes IS 'Total break minutes during this shift';
