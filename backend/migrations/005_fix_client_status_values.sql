-- Migration: Fix Client Status Values
-- This migration updates the client status column to use correct values:
-- PROSPECT, CURRENT, ARCHIVED (instead of PROSPECT, ACTIVE, INACTIVE, ARCHIVED)
-- 
-- Run with: npx ts-node backend/migrations/run-migration.ts 005_fix_client_status_values.sql

-- Update ACTIVE clients to CURRENT
UPDATE clients SET status = 'CURRENT' WHERE status = 'ACTIVE';

-- Update INACTIVE clients to CURRENT (they can be archived separately if needed)
UPDATE clients SET status = 'CURRENT' WHERE status = 'INACTIVE';

-- Note: PROSPECT and ARCHIVED remain unchanged as they are valid statuses

-- Verify the update
SELECT status, COUNT(*) as count FROM clients GROUP BY status;
