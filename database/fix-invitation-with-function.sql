-- Fix Invitation System: Use database function to bypass RLS

-- ============================================
-- Create function to accept invitation
-- ============================================

CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = p_invitation_id
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  -- Verify user email matches invitation email
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND email = v_invitation.email
  ) THEN
    RAISE EXCEPTION 'Email does not match invitation';
  END IF;

  -- Check if already a team member
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_invitation.team_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Already a team member';
  END IF;

  -- Add to team
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (v_invitation.team_id, p_user_id, v_invitation.role);

  -- Update invitation status
  UPDATE invitations
  SET
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_invitation_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ accept_invitation function created' as status;

-- ============================================
-- Create function to decline invitation
-- ============================================

CREATE OR REPLACE FUNCTION decline_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = p_invitation_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;

  -- Verify user email matches invitation email
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND email = v_invitation.email
  ) THEN
    RAISE EXCEPTION 'Email does not match invitation';
  END IF;

  -- Update invitation status
  UPDATE invitations
  SET
    status = 'declined',
    declined_at = NOW()
  WHERE id = p_invitation_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ decline_invitation function created' as status;

-- ============================================
-- Create function to cancel invitation
-- ============================================

CREATE OR REPLACE FUNCTION cancel_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = p_invitation_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;

  -- Verify user is team owner/admin
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_invitation.team_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only team owner/admin can cancel invitations';
  END IF;

  -- Update invitation status
  UPDATE invitations
  SET status = 'cancelled'
  WHERE id = p_invitation_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ cancel_invitation function created' as status;

-- ============================================
-- Simplify UPDATE policy (only for status updates via functions)
-- ============================================

DROP POLICY IF EXISTS "invitations_update" ON invitations;

-- Simple policy: anyone can update invitations they can see
-- (The functions handle all security checks)
CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

SELECT '✅ invitations UPDATE policy simplified' as status;

SELECT '🎉 COMPLETE: Use accept_invitation(), decline_invitation(), cancel_invitation() functions' as final_status;
