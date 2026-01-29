-- Migration: Add Reports Table
-- This creates the reports table for tracking user-submitted issues/reports

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    screenshot_url TEXT,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_to_id ON reports(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Comments
COMMENT ON TABLE reports IS 'User-submitted reports for issues, safety concerns, etc.';
COMMENT ON COLUMN reports.category IS 'equipment_issue, safety_concern, schedule_problem, site_access, client_complaint, other';
COMMENT ON COLUMN reports.priority IS 'low, medium, high, urgent';
COMMENT ON COLUMN reports.status IS 'open, in_progress, resolved, closed';
