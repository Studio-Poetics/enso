-- Enforce Viewer Role: Read-Only Access
-- Viewers should not be able to edit projects, even if they're collaborators

-- ============================================
-- Update projects UPDATE policy
-- ============================================

DROP POLICY IF EXISTS "projects_update" ON projects;

-- Only allow updates if user is collaborator AND not a viewer
CREATE POLICY "projects_update" ON projects
  FOR UPDATE
  USING (
    -- User is in collaborators array
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(content->'collaborators')
    )
    AND
    -- User is NOT a viewer (check their role in ANY team)
    NOT EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.team_id = projects.team_id
        AND team_members.role = 'viewer'
    )
  );

SELECT '✅ Projects UPDATE policy updated - viewers blocked from editing' as status;

-- Verification
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'projects' AND cmd = 'UPDATE';
