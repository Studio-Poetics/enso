-- Emergency Fix: team_members RLS is causing 500 errors
-- The issue is likely with INSERT/UPDATE/DELETE policies

-- First, check current state
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'team_members';

-- Drop ALL policies on team_members
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can view memberships" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
-- SELECT: Users can see memberships where they are the user
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- INSERT: Allow service role and authenticated users to insert
-- (needed for signup and invitations)
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- UPDATE: Allow users to update their own memberships
CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- DELETE: Allow users to delete their own memberships (leave team)
CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE USING (
    user_id = auth.uid()
  );

SELECT '✅ team_members RLS policies fixed' as status;

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'team_members';
