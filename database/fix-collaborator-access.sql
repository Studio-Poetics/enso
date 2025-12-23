-- Fix Collaborator Access Control
-- Only users in the collaborators array should see projects
-- Removing someone from collaborators immediately revokes their access

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;

-- NEW: Simplified policy - only collaborators can view
-- Users can view a project if:
-- 1. They are in the collaborators array, OR
-- 2. They are the project owner (owner is always in collaborators via trigger)
CREATE POLICY "Only collaborators can view projects" ON projects
  FOR SELECT USING (
    -- User must be in the collaborators array
    auth.uid()::text = ANY(
      SELECT jsonb_array_elements_text(content->'collaborators')
    )
  );

-- Verify the new policy
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'projects'
  AND policyname = 'Only collaborators can view projects';

SELECT '✅ Collaborator access control updated successfully!' as message;
