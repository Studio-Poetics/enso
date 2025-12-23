-- Fix Invitation UPDATE: Allow accepting/canceling invitations

-- ============================================
-- FIX: invitations UPDATE policy
-- ============================================

DROP POLICY IF EXISTS "invitations_update" ON invitations;

-- Allow users to update invitations to their email
-- OR team owner/admin to cancel invitations
CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE
  USING (
    -- User's email matches invitation email (for accepting)
    email IN (SELECT email FROM profiles WHERE id = auth.uid())
    OR
    -- Team owner/admin can update (for canceling)
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    -- Same conditions for the updated state
    email IN (SELECT email FROM profiles WHERE id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'admin')
    )
  );

SELECT '✅ invitations UPDATE policy fixed' as status;
SELECT 'Users can now accept invitations' as note1;
SELECT 'Owners/admins can cancel invitations' as note2;

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'invitations' AND cmd = 'UPDATE';
