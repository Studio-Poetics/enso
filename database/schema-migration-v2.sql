-- Multi-Team Collaboration: Schema Migration v2
-- Adds project visibility and updates RLS policies for project-level permissions

-- Add visibility column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility text CHECK (visibility IN ('private', 'team')) DEFAULT 'team';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);

-- Drop ALL existing RLS policies on projects table
DROP POLICY IF EXISTS "Team members can view projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Team members can create projects" ON projects;
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Collaborators can update projects" ON projects;
DROP POLICY IF EXISTS "Owners and admins can delete projects" ON projects;

-- NEW: Project visibility policy
-- Users can view projects if:
-- 1. They are team members AND project is team-wide, OR
-- 2. They are in the project's collaborators list (for private projects), OR
-- 3. They are the project owner
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
    AND (
      -- Team-wide projects visible to all team members
      visibility = 'team'
      OR
      -- Private projects visible to owner and collaborators
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
    -- Owner can always update
    owner_id = auth.uid()
    OR
    -- Collaborators can update
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(content->'collaborators')
    )
  );

-- NEW: Project delete policy (owner and team admins only)
CREATE POLICY "Owners and admins can delete projects" ON projects
  FOR DELETE USING (
    -- Owner can always delete
    owner_id = auth.uid()
    OR
    -- Team admins can delete team-wide projects
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
DROP TRIGGER IF EXISTS project_collaborator_check ON projects;
DROP FUNCTION IF EXISTS ensure_owner_in_collaborators();

CREATE OR REPLACE FUNCTION ensure_owner_in_collaborators()
RETURNS TRIGGER AS $$
BEGIN
  -- If collaborators is null or empty, initialize with owner
  IF NEW.content->'collaborators' IS NULL THEN
    NEW.content = jsonb_set(
      COALESCE(NEW.content, '{}'::jsonb),
      '{collaborators}',
      jsonb_build_array(NEW.owner_id::text)
    );
  -- If owner is not in collaborators, add them
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

-- Create trigger for new projects and updates
CREATE TRIGGER project_collaborator_check
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION ensure_owner_in_collaborators();

-- Verify schema changes
COMMENT ON COLUMN projects.visibility IS 'Project visibility: private (collaborators only) or team (all team members)';
