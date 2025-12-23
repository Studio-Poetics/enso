-- Complete Production Migration: Team Management Features
-- Run this entire script in Supabase SQL Editor
-- This fixes 500 errors AND adds all team management features

-- ============================================
-- STEP 1: Emergency Fix - Restore Basic RLS
-- ============================================

-- Drop the broken policy that references non-existent deleted_at
DROP POLICY IF EXISTS "Users can view active teams" ON teams;

-- Restore simple team viewing policy
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Ensure team_members has RLS enabled
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Ensure team_members has basic SELECT policy
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
CREATE POLICY "Users can view their team memberships" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- Ensure invitations has RLS enabled
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

SELECT '✅ Step 1 Complete: Basic RLS restored' as status;

-- ============================================
-- STEP 2: Add Team Management Features
-- ============================================

-- Add soft delete columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_deleted_at ON teams(deleted_at);
CREATE INDEX IF NOT EXISTS idx_teams_scheduled_deletion ON teams(scheduled_deletion_at);

-- Add comments for documentation
COMMENT ON COLUMN teams.deleted_at IS 'Timestamp when team was soft deleted (NULL = active)';
COMMENT ON COLUMN teams.scheduled_deletion_at IS 'Timestamp when team will be permanently deleted (30 days after soft delete)';
COMMENT ON COLUMN teams.deleted_by IS 'User ID who deleted the team';

SELECT '✅ Step 2 Complete: Soft delete columns added' as status;

-- ============================================
-- STEP 3: Update RLS Policy with Deleted Check
-- ============================================

-- Now that deleted_at exists, update the policy to exclude deleted teams
DROP POLICY IF EXISTS "Users can view their teams" ON teams;

CREATE POLICY "Users can view active teams" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

SELECT '✅ Step 3 Complete: RLS policy updated to exclude deleted teams' as status;

-- ============================================
-- STEP 4: Create Database Functions
-- ============================================

-- Function to soft delete a team
CREATE OR REPLACE FUNCTION soft_delete_team(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Check if user is team owner
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only team owner can delete the team';
  END IF;

  -- Soft delete the team
  UPDATE teams
  SET
    deleted_at = NOW(),
    scheduled_deletion_at = NOW() + INTERVAL '30 days',
    deleted_by = p_user_id
  WHERE id = p_team_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found or already deleted';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a deleted team
CREATE OR REPLACE FUNCTION restore_deleted_team(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Check if user was the one who deleted it or is owner
  IF NOT EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id
      AND (deleted_by = p_user_id OR id IN (
        SELECT team_id FROM team_members
        WHERE user_id = p_user_id AND role = 'owner'
      ))
  ) THEN
    RAISE EXCEPTION 'Only the team owner can restore the team';
  END IF;

  -- Restore the team
  UPDATE teams
  SET
    deleted_at = NULL,
    scheduled_deletion_at = NULL,
    deleted_by = NULL
  WHERE id = p_team_id
    AND deleted_at IS NOT NULL
    AND scheduled_deletion_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found or deletion period expired';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete expired teams
CREATE OR REPLACE FUNCTION cleanup_expired_teams()
RETURNS void AS $$
BEGIN
  DELETE FROM teams
  WHERE deleted_at IS NOT NULL
    AND scheduled_deletion_at IS NOT NULL
    AND scheduled_deletion_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to transfer team ownership
CREATE OR REPLACE FUNCTION transfer_team_ownership(
  p_team_id UUID,
  p_current_owner_id UUID,
  p_new_owner_id UUID
)
RETURNS void AS $$
BEGIN
  -- Verify current owner
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_current_owner_id
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only current owner can transfer ownership';
  END IF;

  -- Verify new owner is a team member
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'New owner must be a team member';
  END IF;

  -- Update team owner
  UPDATE teams
  SET owner_id = p_new_owner_id
  WHERE id = p_team_id;

  -- Update team_members: current owner becomes admin, new owner becomes owner
  UPDATE team_members
  SET role = 'admin'
  WHERE team_id = p_team_id
    AND user_id = p_current_owner_id;

  UPDATE team_members
  SET role = 'owner'
  WHERE team_id = p_team_id
    AND user_id = p_new_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove team member
CREATE OR REPLACE FUNCTION remove_team_member(
  p_team_id UUID,
  p_user_id UUID,
  p_member_to_remove UUID
)
RETURNS void AS $$
BEGIN
  -- Check if user has permission (owner or admin)
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only team owner or admin can remove members';
  END IF;

  -- Cannot remove the owner
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_member_to_remove
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Cannot remove team owner. Transfer ownership first.';
  END IF;

  -- Remove member
  DELETE FROM team_members
  WHERE team_id = p_team_id
    AND user_id = p_member_to_remove;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in team';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update team member role
CREATE OR REPLACE FUNCTION update_team_member_role(
  p_team_id UUID,
  p_user_id UUID,
  p_member_id UUID,
  p_new_role TEXT
)
RETURNS void AS $$
BEGIN
  -- Validate role
  IF p_new_role NOT IN ('admin', 'member', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin, member, or viewer';
  END IF;

  -- Check if user has permission (only owner can change roles)
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only team owner can change member roles';
  END IF;

  -- Cannot change owner's role
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_member_id
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Cannot change owner role. Transfer ownership first.';
  END IF;

  -- Update role
  UPDATE team_members
  SET role = p_new_role
  WHERE team_id = p_team_id
    AND user_id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in team';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Step 4 Complete: Database functions created' as status;

-- ============================================
-- STEP 5: Fix Backup Table Security
-- ============================================

-- Drop the backup table since migration is complete
DROP TABLE IF EXISTS projects_backup;

SELECT '✅ Step 5 Complete: Backup table removed' as status;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '🎉 MIGRATION COMPLETE! All team management features enabled.' as final_status;

-- Show existing teams
SELECT
  id,
  name,
  owner_id,
  deleted_at,
  scheduled_deletion_at
FROM teams
LIMIT 5;
