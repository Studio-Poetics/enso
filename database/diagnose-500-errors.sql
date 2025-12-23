-- Diagnostic Query: Check for 500 Error Causes
-- Run this to identify database issues

-- 1. Check if deleted_at column exists on teams table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teams'
  AND column_name IN ('deleted_at', 'scheduled_deletion_at', 'deleted_by');

-- 2. Check team_members table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'team_members';

-- 3. Check invitations table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invitations';

-- 4. Check all RLS policies on team_members
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'team_members';

-- 5. Check all RLS policies on invitations
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'invitations';

-- 6. Check all RLS policies on teams
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'teams';

-- 7. Check if RLS is enabled on these tables
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('team_members', 'invitations', 'teams', 'profiles')
  AND schemaname = 'public';

-- 8. Test if we can query team_members (this will show the actual error)
-- SELECT role FROM team_members WHERE user_id = auth.uid() LIMIT 1;
