-- Emergency Fix: Restore working RLS policies
-- This fixes the 500 errors by reverting to simple policies

-- 1. Drop the policy that checks deleted_at (which may not exist)
DROP POLICY IF EXISTS "Users can view active teams" ON teams;

-- 2. Restore simple team viewing policy (without deleted_at check)
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- 3. Verify team_members has proper RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'team_members';

-- 4. If team_members doesn't have RLS, enable it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'team_members'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- 5. Ensure team_members has basic SELECT policy
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;

CREATE POLICY "Users can view their team memberships" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- 6. Verify invitations RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'invitations'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

SELECT '✅ Emergency RLS fix applied - 500 errors should be resolved' as status;
