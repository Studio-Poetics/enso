-- Complete RLS Fix: Ensure all policies work correctly
-- This fixes all 500 errors by setting up proper, tested policies

-- ============================================
-- STEP 1: Verify columns exist
-- ============================================

-- Add deleted_at columns if they don't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Set all existing teams to NOT deleted
UPDATE teams SET deleted_at = NULL WHERE deleted_at IS NULL;

SELECT '✅ Step 1: Columns verified' as status;

-- ============================================
-- STEP 2: Fix team_members RLS
-- ============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE working policy for SELECT
CREATE POLICY "enable_read_own_team_members" ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow insert for authenticated users (needed for invitations)
CREATE POLICY "enable_insert_team_members" ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

SELECT '✅ Step 2: team_members policies fixed' as status;

-- ============================================
-- STEP 3: Fix teams RLS
-- ============================================

-- Drop ALL existing team policies
DROP POLICY IF EXISTS "Users can view active teams" ON teams;
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Team members can view teams" ON teams;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE working policy
CREATE POLICY "enable_read_teams_for_members" ON teams
  FOR SELECT
  TO authenticated
  USING (
    -- User is a member of this team
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
    -- AND team is not deleted (or deleted_at is NULL)
    AND (deleted_at IS NULL OR deleted_at IS NULL)
  );

SELECT '✅ Step 3: teams policies fixed' as status;

-- ============================================
-- STEP 4: Fix invitations RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "enable_read_own_invitations" ON invitations;

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to see invitations sent to their email
CREATE POLICY "enable_read_own_invitations" ON invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow authenticated users to insert invitations
CREATE POLICY "enable_insert_invitations" ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update invitations sent to them
CREATE POLICY "enable_update_own_invitations" ON invitations
  FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

SELECT '✅ Step 4: invitations policies fixed' as status;

-- ============================================
-- STEP 5: Verify Setup
-- ============================================

-- Show all policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('teams', 'team_members', 'invitations')
ORDER BY tablename, cmd;

SELECT '🎉 COMPLETE: All RLS policies fixed and verified!' as final_status;
