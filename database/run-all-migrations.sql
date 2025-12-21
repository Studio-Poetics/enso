-- ============================================================================
-- MULTI-TEAM COLLABORATION: COMPLETE MIGRATION SCRIPT
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- STEP 1: SCHEMA MIGRATION
-- ============================================================================

-- Add visibility column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility text CHECK (visibility IN ('private', 'team')) DEFAULT 'team';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Team members can view projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Team members can create projects" ON projects;

-- NEW: Project visibility policy
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
    AND (
      visibility = 'team'
      OR
      (visibility = 'private' AND (
        owner_id = auth.uid()
        OR
        auth.uid()::text = ANY(
          SELECT jsonb_array_elements_text(content->'collaborators')
        )
      ))
    )
  );

-- NEW: Project update policy (owner and collaborators can edit)
CREATE POLICY "Collaborators can update projects" ON projects
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(content->'collaborators')
    )
  );

-- NEW: Project delete policy (owner and team admins only)
CREATE POLICY "Owners and admins can delete projects" ON projects
  FOR DELETE USING (
    owner_id = auth.uid()
    OR
    (visibility = 'team' AND team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
  );

-- NEW: Project create policy (team members can create projects)
CREATE POLICY "Team members can create projects" ON projects
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ) AND owner_id = auth.uid()
  );

-- Add trigger to ensure owner is always in collaborators array
CREATE OR REPLACE FUNCTION ensure_owner_in_collaborators()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content->'collaborators' IS NULL THEN
    NEW.content = jsonb_set(
      COALESCE(NEW.content, '{}'::jsonb),
      '{collaborators}',
      jsonb_build_array(NEW.owner_id::text)
    );
  ELSIF NOT (NEW.content->'collaborators' @> jsonb_build_array(NEW.owner_id::text)) THEN
    NEW.content = jsonb_set(
      NEW.content,
      '{collaborators}',
      (NEW.content->'collaborators' || jsonb_build_array(NEW.owner_id::text))
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_collaborator_check ON projects;
CREATE TRIGGER project_collaborator_check
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION ensure_owner_in_collaborators();

-- ============================================================================
-- STEP 2: DATA MIGRATION
-- ============================================================================

-- Backup existing projects
CREATE TABLE IF NOT EXISTS projects_backup AS SELECT * FROM projects;

-- Set default visibility for existing projects
UPDATE projects
SET visibility = 'team'
WHERE visibility IS NULL;

-- Ensure owner is in collaborators array for all projects
UPDATE projects
SET content = jsonb_set(
  COALESCE(content, '{}'::jsonb),
  '{collaborators}',
  CASE
    WHEN content->'collaborators' IS NULL THEN
      jsonb_build_array(owner_id::text)
    WHEN NOT content->'collaborators' @> jsonb_build_array(owner_id::text) THEN
      content->'collaborators' || jsonb_build_array(owner_id::text)
    ELSE
      content->'collaborators'
  END
)
WHERE content->'collaborators' IS NULL
   OR NOT content->'collaborators' @> jsonb_build_array(owner_id::text);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- This should return 0 rows if migration was successful
SELECT
  id,
  title,
  visibility,
  owner_id,
  content->'collaborators' as collaborators,
  (content->'collaborators' @> jsonb_build_array(owner_id::text)) as owner_in_collabs
FROM projects
WHERE visibility IS NULL
   OR content->'collaborators' IS NULL
   OR NOT (content->'collaborators' @> jsonb_build_array(owner_id::text));

-- Migration Summary
DO $$
DECLARE
  project_count integer;
  migrated_count integer;
BEGIN
  SELECT COUNT(*) INTO project_count FROM projects;
  SELECT COUNT(*) INTO migrated_count
  FROM projects
  WHERE visibility IS NOT NULL
    AND content->'collaborators' IS NOT NULL
    AND content->'collaborators' @> jsonb_build_array(owner_id::text);

  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total projects: %', project_count;
  RAISE NOTICE 'Successfully migrated: %', migrated_count;
  RAISE NOTICE 'Migration complete: %', (project_count = migrated_count);
  RAISE NOTICE '============================================';
END $$;
