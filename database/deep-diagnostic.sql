-- Deep Diagnostic: Find the root cause of 500 errors

-- ============================================
-- 1. Check for triggers on team_members
-- ============================================
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'team_members';

-- ============================================
-- 2. Check table structure
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- ============================================
-- 3. Check for any constraints that might fail
-- ============================================
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'team_members';

-- ============================================
-- 4. Try to select data directly (bypass PostgREST)
-- ============================================
SELECT
  user_id,
  team_id,
  role,
  created_at
FROM team_members
LIMIT 5;

-- ============================================
-- 5. Check if RLS is causing issues - TEMPORARILY DISABLE IT
-- ============================================
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;

SELECT '⚠️  WARNING: RLS TEMPORARILY DISABLED FOR TESTING' as status;
SELECT 'Test your app now - if it works, RLS is the issue' as instruction;
SELECT 'If still 500 errors, the problem is deeper (triggers/data)' as note;

-- After testing, re-enable with:
-- ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
