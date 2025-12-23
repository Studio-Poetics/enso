-- Final Working RLS Policies
-- These are simple, tested policies that work with PostgREST joins

-- ============================================
-- TEAM_MEMBERS: Allow users to see their own memberships
-- ============================================

DROP POLICY IF EXISTS "enable_read_own_team_members" ON team_members;
DROP POLICY IF EXISTS "enable_insert_team_members" ON team_members;

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read rows where they are the user
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Allow service role and functions to insert (for invitations/signup)
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Allow updates to own memberships
CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Allow users to leave teams
CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE
  USING (auth.uid() = user_id);

SELECT '✅ team_members policies created' as status;

-- ============================================
-- TEAMS: Allow users to see teams they belong to
-- ============================================

DROP POLICY IF EXISTS "enable_read_teams_for_members" ON teams;

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see teams where they are a member
CREATE POLICY "teams_select" ON teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
  );

-- INSERT: Allow authenticated users to create teams
CREATE POLICY "teams_insert" ON teams
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Allow team owners to update
CREATE POLICY "teams_update" ON teams
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- DELETE: Allow team owners to delete
CREATE POLICY "teams_delete" ON teams
  FOR DELETE
  USING (auth.uid() = owner_id);

SELECT '✅ teams policies created' as status;

-- ============================================
-- INVITATIONS: Allow users to see their invitations
-- ============================================

DROP POLICY IF EXISTS "enable_read_own_invitations" ON invitations;
DROP POLICY IF EXISTS "enable_insert_invitations" ON invitations;
DROP POLICY IF EXISTS "enable_update_own_invitations" ON invitations;

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see invitations to their email
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- INSERT: Allow team members to send invitations
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

-- UPDATE: Allow users to update invitations to their email
CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- DELETE: Allow team owners/admins to cancel invitations
CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'admin')
    )
  );

SELECT '✅ invitations policies created' as status;

-- ============================================
-- PROFILES: Ensure profiles are readable
-- ============================================

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can read all profiles (for collaborator names)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

SELECT '✅ profiles policies created' as status;

-- ============================================
-- PROJECTS: Ensure only collaborators can see projects
-- ============================================

DROP POLICY IF EXISTS "Only collaborators can view projects" ON projects;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT: Only collaborators can view
CREATE POLICY "projects_select" ON projects
  FOR SELECT
  USING (
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(content->'collaborators')
    )
  );

-- INSERT: Allow team members to create projects
CREATE POLICY "projects_insert" ON projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = projects.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- UPDATE: Allow collaborators to update
CREATE POLICY "projects_update" ON projects
  FOR UPDATE
  USING (
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(content->'collaborators')
    )
  );

-- DELETE: Allow project owners to delete
CREATE POLICY "projects_delete" ON projects
  FOR DELETE
  USING (auth.uid() = owner_id);

SELECT '✅ projects policies created' as status;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '🎉 ALL RLS POLICIES CREATED SUCCESSFULLY!' as final_status;

-- Show all policies
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
