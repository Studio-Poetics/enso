-- Diagnose why teams aren't loading

-- 1. Check if deleted_at column exists on teams
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'teams'
  AND column_name IN ('deleted_at', 'scheduled_deletion_at', 'deleted_by');

-- 2. Check current teams RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'teams';

-- 3. Check if there are any teams at all
SELECT id, name, owner_id, deleted_at, created_at
FROM teams
LIMIT 5;

-- 4. Test the exact query that's failing
-- This simulates what getUserTeams() does
-- SELECT team_id, role, teams(id, name, owner_id)
-- FROM team_members
-- WHERE user_id = auth.uid();

-- 5. Check team_members data
SELECT tm.user_id, tm.team_id, tm.role, t.name as team_name
FROM team_members tm
LEFT JOIN teams t ON tm.team_id = t.id
LIMIT 10;
