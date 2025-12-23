-- Fix Invitation RLS: Allow duplicate checks

-- ============================================
-- FIX 1: team_members - Allow checking if someone is a member
-- ============================================

DROP POLICY IF EXISTS "team_members_select" ON team_members;

CREATE POLICY "team_members_select" ON team_members
  FOR SELECT
  USING (
    -- Users can see their own memberships
    auth.uid() = user_id
    OR
    -- Team members can see all memberships in their teams
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

SELECT '✅ team_members SELECT policy updated' as status;

-- ============================================
-- FIX 2: invitations - Allow team members to see team invitations
-- ============================================

DROP POLICY IF EXISTS "invitations_select" ON invitations;

CREATE POLICY "invitations_select" ON invitations
  FOR SELECT
  USING (
    -- Users can see invitations to their email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- Team members can see all invitations for their teams
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

SELECT '✅ invitations SELECT policy updated' as status;

-- ============================================
-- FIX 3: Restrict invitation INSERT to owner/admin only
-- ============================================

DROP POLICY IF EXISTS "invitations_insert" ON invitations;

CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'admin')
    )
  );

SELECT '✅ invitations INSERT policy updated (owner/admin only)' as status;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '🎉 Invitation policies fixed!' as final_status;
SELECT 'Team members can now see team data for duplicate checks' as note1;
SELECT 'Only owner/admin can insert invitations (backend enforced)' as note2;
