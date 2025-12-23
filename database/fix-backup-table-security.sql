-- Fix Security Issue: Enable RLS on projects_backup table
-- This table was created during migration but lacks Row Level Security

-- Option 1: If backup is no longer needed (recommended after successful migration)
-- Uncomment the line below to drop the backup table:
-- DROP TABLE IF EXISTS projects_backup;

-- Option 2: If you want to keep the backup table, enable RLS
-- This prevents unauthorized access via PostgREST API

ALTER TABLE projects_backup ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy: Only allow database admins to access backup
-- Regular users (including via PostgREST) cannot read this table
CREATE POLICY "Only admins can access backup table" ON projects_backup
  FOR ALL USING (false);

-- Verification
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'projects_backup';

SELECT '✅ Security issue fixed: RLS enabled on projects_backup table' as message;
