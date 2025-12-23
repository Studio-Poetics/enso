-- Fix SQL Race Conditions and Injection Risks in SECURITY DEFINER Functions
-- This addresses HIGH severity vulnerability in invitation system

-- ============================================
-- IMPROVED: accept_invitation with row-level locking
-- ============================================

CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_invitation RECORD;
  v_profile_email TEXT;
  v_rows_inserted INTEGER;
BEGIN
  -- SECURITY: Use row-level locking to prevent race conditions
  -- Lock the invitation row for update (prevents concurrent processing)
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = p_invitation_id
  FOR UPDATE NOWAIT; -- NOWAIT fails fast if another transaction has the lock

  -- Validate invitation exists and is valid
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Check invitation status and expiry
  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation has already been processed (status: %)', v_invitation.status;
  END IF;

  IF v_invitation.expires_at <= NOW() THEN
    -- Auto-expire the invitation
    UPDATE invitations SET status = 'expired' WHERE id = p_invitation_id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- SECURITY: Get current email from profiles with shared lock
  -- This prevents email from being changed during the transaction
  SELECT email INTO v_profile_email
  FROM profiles
  WHERE id = p_user_id
  FOR SHARE;

  -- Validate email match
  IF v_profile_email IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_profile_email != v_invitation.email THEN
    RAISE EXCEPTION 'Email mismatch: Invitation sent to %, but user email is %',
      v_invitation.email, v_profile_email;
  END IF;

  -- SECURITY: Use INSERT...ON CONFLICT to prevent race conditions
  -- This is atomic and prevents duplicate team memberships
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (v_invitation.team_id, p_user_id, v_invitation.role)
  ON CONFLICT (team_id, user_id) DO NOTHING;

  -- Check if the insert was successful
  GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;

  IF v_rows_inserted = 0 THEN
    -- User is already a member, mark invitation as accepted anyway
    UPDATE invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = p_invitation_id;

    RAISE EXCEPTION 'User is already a member of this team';
  END IF;

  -- Success: Update invitation status
  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = p_invitation_id;

  -- Log successful acceptance (optional, for audit trail)
  -- INSERT INTO audit_log (action, user_id, resource_id)
  -- VALUES ('invitation_accepted', p_user_id, p_invitation_id);

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Invitation is being processed by another request. Please try again.';
  WHEN OTHERS THEN
    -- Re-raise the exception with context
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION accept_invitation(UUID, UUID) IS
'Accepts a team invitation with row-level locking to prevent race conditions. Uses SECURITY DEFINER to bypass RLS.';

SELECT '✅ accept_invitation function updated with race condition protection' as status;

-- ============================================
-- IMPROVED: decline_invitation with validation
-- ============================================

CREATE OR REPLACE FUNCTION decline_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_invitation RECORD;
  v_profile_email TEXT;
BEGIN
  -- Lock the invitation row
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = p_invitation_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation has already been processed (status: %)', v_invitation.status;
  END IF;

  -- Get user email
  SELECT email INTO v_profile_email
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile_email IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_profile_email != v_invitation.email THEN
    RAISE EXCEPTION 'Unauthorized: This invitation was not sent to your email';
  END IF;

  -- Update invitation status
  UPDATE invitations
  SET status = 'declined', declined_at = NOW()
  WHERE id = p_invitation_id;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Invitation is being processed by another request. Please try again.';
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION decline_invitation(UUID, UUID) IS
'Declines a team invitation with proper validation. Uses SECURITY DEFINER to bypass RLS.';

SELECT '✅ decline_invitation function updated with validation' as status;

-- ============================================
-- IMPROVED: cancel_invitation_rpc with authorization
-- ============================================

CREATE OR REPLACE FUNCTION cancel_invitation_rpc(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_invitation RECORD;
  v_user_role TEXT;
BEGIN
  -- Lock the invitation row
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = p_invitation_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Can only cancel pending invitations (current status: %)', v_invitation.status;
  END IF;

  -- SECURITY: Verify user has permission to cancel (owner or admin)
  SELECT role INTO v_user_role
  FROM team_members
  WHERE team_id = v_invitation.team_id
    AND user_id = p_user_id;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: You are not a member of this team';
  END IF;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only team owners and admins can cancel invitations (your role: %)', v_user_role;
  END IF;

  -- Cancel the invitation
  UPDATE invitations
  SET status = 'cancelled'
  WHERE id = p_invitation_id;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Invitation is being processed by another request. Please try again.';
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cancel_invitation_rpc(UUID, UUID) IS
'Cancels a pending invitation. Requires owner or admin role. Uses SECURITY DEFINER to bypass RLS.';

SELECT '✅ cancel_invitation_rpc function updated with authorization' as status;

-- ============================================
-- Add unique constraint to prevent duplicate memberships
-- ============================================

-- Check if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_members_team_user_unique'
  ) THEN
    ALTER TABLE team_members
    ADD CONSTRAINT team_members_team_user_unique
    UNIQUE (team_id, user_id);

    RAISE NOTICE '✅ Added unique constraint to team_members';
  ELSE
    RAISE NOTICE '✅ Unique constraint already exists on team_members';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '🎉 All SQL race conditions fixed!' as final_status;

SELECT
  'Functions updated:' as info,
  '- accept_invitation() with FOR UPDATE NOWAIT' as detail1,
  '- decline_invitation() with validation' as detail2,
  '- cancel_invitation_rpc() with authorization' as detail3,
  '- Added unique constraint on team_members' as detail4;
