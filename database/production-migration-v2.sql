-- Complete Production Migration v2: Team Management Features
-- Handles existing policies gracefully

-- ============================================
-- STEP 1: Clean Slate - Drop ALL existing team policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can view active teams" ON teams;
DROP POLICY IF EXISTS "Team members can view teams" ON teams;
DROP POLICY IF EXISTS "Users can view own team" ON teams;

SELECT '✅ Step 1a: Cleaned up existing team policies' as status;

-- Drop and recreate team_members policies
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can view memberships" ON team_members;

SELECT '✅ Step 1b: Cleaned up team_members policies' as status;

-- ============================================
-- STEP 2: Add Soft Delete Columns
-- ============================================

ALTER TABLE teams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_teams_deleted_at ON teams(deleted_at);
CREATE INDEX IF NOT EXISTS idx_teams_scheduled_deletion ON teams(scheduled_deletion_at);

COMMENT ON COLUMN teams.deleted_at IS 'Timestamp when team was soft deleted (NULL = active)';
COMMENT ON COLUMN teams.scheduled_deletion_at IS 'Timestamp when team will be permanently deleted (30 days after soft delete)';
COMMENT ON COLUMN teams.deleted_by IS 'User ID who deleted the team';

SELECT '✅ Step 2: Soft delete columns added' as status;

-- ============================================
-- STEP 3: Create Fresh RLS Policies
-- ============================================

-- Enable RLS on tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Teams: Users can only view active teams they're members of
CREATE POLICY "Users can view active teams" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Team Members: Users can view their own memberships
CREATE POLICY "Users can view their team memberships" ON team_members
  FOR SELECT USING (user_id = auth.uid());

SELECT '✅ Step 3: Fresh RLS policies created' as status;

-- ============================================
-- STEP 4: Create Database Functions
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete_team(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only team owner can delete the team';
  END IF;

  UPDATE teams
  SET deleted_at = NOW(), scheduled_deletion_at = NOW() + INTERVAL '30 days', deleted_by = p_user_id
  WHERE id = p_team_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found or already deleted';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION restore_deleted_team(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id AND (deleted_by = p_user_id OR id IN (
      SELECT team_id FROM team_members WHERE user_id = p_user_id AND role = 'owner'
    ))
  ) THEN
    RAISE EXCEPTION 'Only the team owner can restore the team';
  END IF;

  UPDATE teams
  SET deleted_at = NULL, scheduled_deletion_at = NULL, deleted_by = NULL
  WHERE id = p_team_id AND deleted_at IS NOT NULL AND scheduled_deletion_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found or deletion period expired';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_teams()
RETURNS void AS $$
BEGIN
  DELETE FROM teams
  WHERE deleted_at IS NOT NULL
    AND scheduled_deletion_at IS NOT NULL
    AND scheduled_deletion_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION transfer_team_ownership(
  p_team_id UUID,
  p_current_owner_id UUID,
  p_new_owner_id UUID
)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_current_owner_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only current owner can transfer ownership';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM team_members WHERE team_id = p_team_id AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'New owner must be a team member';
  END IF;

  UPDATE teams SET owner_id = p_new_owner_id WHERE id = p_team_id;

  UPDATE team_members SET role = 'admin'
  WHERE team_id = p_team_id AND user_id = p_current_owner_id;

  UPDATE team_members SET role = 'owner'
  WHERE team_id = p_team_id AND user_id = p_new_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_team_member(
  p_team_id UUID,
  p_user_id UUID,
  p_member_to_remove UUID
)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only team owner or admin can remove members';
  END IF;

  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_member_to_remove AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Cannot remove team owner. Transfer ownership first.';
  END IF;

  DELETE FROM team_members
  WHERE team_id = p_team_id AND user_id = p_member_to_remove;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in team';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_team_member_role(
  p_team_id UUID,
  p_user_id UUID,
  p_member_id UUID,
  p_new_role TEXT
)
RETURNS void AS $$
BEGIN
  IF p_new_role NOT IN ('admin', 'member', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin, member, or viewer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only team owner can change member roles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_member_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Cannot change owner role. Transfer ownership first.';
  END IF;

  UPDATE team_members SET role = p_new_role
  WHERE team_id = p_team_id AND user_id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in team';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Step 4: Database functions created' as status;

-- ============================================
-- STEP 5: Cleanup
-- ============================================

DROP TABLE IF EXISTS projects_backup;

SELECT '✅ Step 5: Cleanup complete' as status;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '🎉 MIGRATION COMPLETE! All features enabled.' as final_status;

-- Show current state
SELECT
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('teams', 'team_members', 'invitations')
  AND schemaname = 'public';
